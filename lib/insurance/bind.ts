import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {all,put,transaction} from '../platform/db';
import {AppError} from '../platform/auth';
import {audit} from '../platform/service';
import type {Member,User} from '../platform/types';
import type {OfferSelection} from './comparison';

export type BindState='HANDOFF_READY'|'HANDOFF_STARTED'|'CARRIER_REVIEW'|'BOUND'|'ACTIVE'|'DECLINED'|'CANCELLED'|'FAILED';

export type BindHandoff={
  id:string;
  householdId:string;
  ownerId:string;
  teenId:string;
  selectionId:string;
  carrierId:string;
  quoteId:string;
  state:BindState;
  externalReference:string;
  createdAt:string;
  updatedAt:string;
  carrierUrl?:string;
  failureReason?:string;
};

export type PolicyRecord={
  id:string;
  householdId:string;
  ownerId:string;
  teenId:string;
  handoffId:string;
  carrierId:string;
  externalPolicyId:string;
  status:'BOUND'|'ACTIVE'|'CANCELLED';
  effectiveAt?:string;
  confirmedAt:string;
  monthlyPremiumCents?:number;
  sixMonthPremiumCents?:number;
};

export type CarrierEvent={
  eventId:string;
  carrierId:string;
  externalReference:string;
  type:'handoff.started'|'application.review'|'policy.bound'|'policy.active'|'application.declined'|'application.failed'|'policy.cancelled';
  occurredAt:string;
  externalPolicyId?:string;
  effectiveAt?:string;
  renewalAt?:string;
  nonRenewalAt?:string;
  reason?:string;
  monthlyPremiumCents?:number;
  sixMonthPremiumCents?:number;
  discounts?:{code:string;label:string;amountCents?:number;source:'carrier'}[];
};

const transitions:Record<BindState,BindState[]>={
  HANDOFF_READY:['HANDOFF_STARTED','FAILED','CANCELLED'],
  HANDOFF_STARTED:['CARRIER_REVIEW','BOUND','DECLINED','FAILED','CANCELLED'],
  CARRIER_REVIEW:['BOUND','DECLINED','FAILED','CANCELLED'],
  BOUND:['ACTIVE','CANCELLED'],
  ACTIVE:['CANCELLED'],
  DECLINED:[],
  CANCELLED:[],
  FAILED:[]
};

function nextState(type:CarrierEvent['type']):BindState{
  if(type==='handoff.started')return 'HANDOFF_STARTED';
  if(type==='application.review')return 'CARRIER_REVIEW';
  if(type==='policy.bound')return 'BOUND';
  if(type==='policy.active')return 'ACTIVE';
  if(type==='application.declined')return 'DECLINED';
  if(type==='policy.cancelled')return 'CANCELLED';
  return 'FAILED';
}

async function guardian(user:User,householdId:string){
  const member=(await all<Member>('member',householdId)).find(item=>item.ownerId===user.id&&item.active);
  if(!member||member.role!=='guardian')throw new AppError('Guardian insurance access required.',403);
}

export async function startBindHandoff(user:User,householdId:string,selectionId:string):Promise<BindHandoff>{
  return transaction(async()=>{
    await guardian(user,householdId);
    const selection=(await all<OfferSelection>('insurance_offer_selection',householdId))
      .find(item=>item.id===selectionId&&item.ownerId===user.id);
    if(!selection)throw new AppError('Insurance offer selection not found.',404);
    if(!selection.bindHandoff.allowed)throw new AppError('This offer cannot start a carrier bind handoff.',409);

    const existing=(await all<BindHandoff>('insurance_bind_handoff',householdId))
      .find(item=>item.selectionId===selectionId&&item.ownerId===user.id);
    if(existing)return existing;

    const createdAt=new Date().toISOString();
    const handoff:BindHandoff={
      id:randomUUID(),
      householdId,
      ownerId:user.id,
      teenId:selection.teenId,
      selectionId,
      carrierId:selection.carrierId,
      quoteId:selection.quoteId,
      state:'HANDOFF_READY',
      externalReference:randomUUID(),
      createdAt,
      updatedAt:createdAt
    };
    await put('insurance_bind_handoff',handoff);
    await audit(user.id,householdId,'insurance.bind.prepare','ALLOW','Guardian created a carrier-controlled bind handoff. Coverage is not active until carrier confirmation.');
    return handoff;
  });
}

export async function readInsuranceStatus(user:User,householdId:string){
  await guardian(user,householdId);
  const handoffs=(await all<BindHandoff>('insurance_bind_handoff',householdId)).filter(item=>item.ownerId===user.id);
  const policies=(await all<PolicyRecord>('insurance_policy',householdId)).filter(item=>item.ownerId===user.id);
  return {handoffs,policies};
}

export function carrierWebhookSecret(carrierId:string){
  let values:Record<string,string>={};
  try{values=JSON.parse(process.env.TEENSURANCE_CARRIER_WEBHOOK_SECRETS||'{}') as Record<string,string>}catch{throw new AppError('Carrier webhook configuration is invalid.',500)}
  const secret=values[carrierId];
  if(!secret)throw new AppError('Carrier webhook is not configured.',503);
  return secret;
}

export function verifyCarrierSignature(rawBody:string,signature:string,secret:string){
  if(!/^[a-f0-9]{64}$/i.test(signature))return false;
  const expected=createHmac('sha256',secret).update(rawBody).digest('hex');
  const supplied=Buffer.from(signature.toLowerCase(),'hex');
  const target=Buffer.from(expected,'hex');
  return supplied.length===target.length&&timingSafeEqual(supplied,target);
}

export async function applyCarrierEvent(event:CarrierEvent){
  return transaction(async()=>{
    if(!event.eventId||!event.carrierId||!event.externalReference||!event.type||!event.occurredAt)throw new AppError('Carrier event is incomplete.',400);
    if(!Number.isFinite(Date.parse(event.occurredAt)))throw new AppError('Carrier event timestamp is invalid.',400);

    const processed=(await all<{id:string;householdId:string;ownerId:string;eventId:string}>('insurance_carrier_event'))
      .some(item=>item.eventId===event.eventId&&item.ownerId===event.carrierId);
    if(processed)return {duplicate:true};

    const handoff=(await all<BindHandoff>('insurance_bind_handoff'))
      .find(item=>item.externalReference===event.externalReference&&item.carrierId===event.carrierId);
    if(!handoff)throw new AppError('Carrier handoff reference not found.',404);

    const target=nextState(event.type);
    if(!transitions[handoff.state].includes(target)){
      if(handoff.state===target)return {duplicate:true,handoff};
      throw new AppError(`Invalid insurance state transition: ${handoff.state} -> ${target}.`,409);
    }
    if((target==='BOUND'||target==='ACTIVE')&&!event.externalPolicyId)throw new AppError('Carrier policy identifier is required for coverage confirmation.',400);

    const updated:BindHandoff={
      ...handoff,
      state:target,
      updatedAt:event.occurredAt,
      failureReason:['DECLINED','FAILED','CANCELLED'].includes(target)?event.reason:undefined
    };
    await put('insurance_bind_handoff',updated);
    await put('insurance_carrier_event',{
      id:randomUUID(),
      householdId:handoff.householdId,
      ownerId:event.carrierId,
      eventId:event.eventId,
      event,
      recordedAt:new Date().toISOString()
    });

    let policy:PolicyRecord|undefined;
    if(target==='BOUND'||target==='ACTIVE'||target==='CANCELLED'){
      const prior=(await all<PolicyRecord>('insurance_policy',handoff.householdId)).find(item=>item.handoffId===handoff.id);
      if(target==='CANCELLED'&&!prior){
        await audit('carrier:'+event.carrierId,handoff.householdId,'insurance.carrier.event','ALLOW','Carrier cancelled a bind process before a policy record existed.');
        return {duplicate:false,handoff:updated};
      }
      if(target==='CANCELLED'&&prior){
        policy={...prior,status:'CANCELLED',confirmedAt:event.occurredAt};
      }else{
        policy={
          id:prior?.id||randomUUID(),
          householdId:handoff.householdId,
          ownerId:handoff.ownerId,
          teenId:handoff.teenId,
          handoffId:handoff.id,
          carrierId:event.carrierId,
          externalPolicyId:event.externalPolicyId!,
          status:target,
          effectiveAt:event.effectiveAt||prior?.effectiveAt,
          confirmedAt:event.occurredAt,
          monthlyPremiumCents:event.monthlyPremiumCents??prior?.monthlyPremiumCents,
          sixMonthPremiumCents:event.sixMonthPremiumCents??prior?.sixMonthPremiumCents
        };
      }
      await put('insurance_policy',policy);
    }

    await audit('carrier:'+event.carrierId,handoff.householdId,'insurance.carrier.event','ALLOW',`Carrier-confirmed insurance transition to ${target}.`);
    return {duplicate:false,handoff:updated,policy};
  });
}
