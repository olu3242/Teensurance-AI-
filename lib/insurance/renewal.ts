import {randomUUID} from 'node:crypto';
import {all,put,transaction} from '../platform/db';
import {AppError} from '../platform/auth';
import {audit} from '../platform/service';
import type {Member,User} from '../platform/types';
import type {BindHandoff,PolicyRecord} from './bind';
import type {QuoteInput,QuoteSession} from './types';
import {createQuoteSession} from './service';

export type RenewalOpportunity={
  policyId:string;
  householdId:string;
  teenId:string;
  carrierId:string;
  externalPolicyId:string;
  renewalAt?:string;
  nonRenewalAt?:string;
  daysUntilAction?:number;
  reason:'renewal_window'|'non_renewal';
  eligible:boolean;
};

export type RenewalDecision={
  id:string;
  householdId:string;
  ownerId:string;
  policyId:string;
  quoteSessionId:string;
  decision:'stay'|'switch';
  selectedCarrierId?:string;
  selectedQuoteId?:string;
  createdAt:string;
};

async function guardian(user:User,householdId:string){
  const member=(await all<Member>('member',householdId)).find(item=>item.ownerId===user.id&&item.active);
  if(!member||member.role!=='guardian')throw new AppError('Guardian insurance access required.',403);
}

function daysUntil(value:string,now=new Date()){
  return Math.ceil((Date.parse(value)-now.getTime())/86400000);
}

export async function renewalOpportunities(user:User,householdId:string,now=new Date()):Promise<RenewalOpportunity[]>{
  await guardian(user,householdId);
  const policies=(await all<PolicyRecord>('insurance_policy',householdId)).filter(item=>item.ownerId===user.id&&item.status==='ACTIVE');
  const handoffs=await all<BindHandoff>('insurance_bind_handoff',householdId);
  const events=await all<{event:{externalReference:string;renewalAt?:string;nonRenewalAt?:string}}>('insurance_carrier_event',householdId);
  return policies.flatMap(policy=>{
    const handoff=handoffs.find(item=>item.id===policy.handoffId);
    if(!handoff)return [];
    const related=events.filter(item=>item.event.externalReference===handoff.externalReference).map(item=>item.event);
    const renewalAt=related.map(item=>item.renewalAt).filter((v):v is string=>Boolean(v)).sort().at(-1);
    const nonRenewalAt=related.map(item=>item.nonRenewalAt).filter((v):v is string=>Boolean(v)).sort().at(-1);
    if(nonRenewalAt){
      const d=daysUntil(nonRenewalAt,now);
      return [{policyId:policy.id,householdId,teenId:policy.teenId,carrierId:policy.carrierId,externalPolicyId:policy.externalPolicyId,nonRenewalAt,daysUntilAction:d,reason:'non_renewal' as const,eligible:d>=0}];
    }
    if(renewalAt){
      const d=daysUntil(renewalAt,now);
      return [{policyId:policy.id,householdId,teenId:policy.teenId,carrierId:policy.carrierId,externalPolicyId:policy.externalPolicyId,renewalAt,daysUntilAction:d,reason:'renewal_window' as const,eligible:d>=0&&d<=60}];
    }
    return [];
  });
}

export async function startRenewalReshop(user:User,householdId:string,policyId:string,idempotencyKey:string){
  return transaction(async()=>{
    await guardian(user,householdId);
    const policy=(await all<PolicyRecord>('insurance_policy',householdId)).find(item=>item.id===policyId&&item.ownerId===user.id&&item.status==='ACTIVE');
    if(!policy)throw new AppError('Active policy not found.',404);
    const opportunities=await renewalOpportunities(user,householdId);
    const opportunity=opportunities.find(item=>item.policyId===policyId&&item.eligible);
    if(!opportunity)throw new AppError('This policy is not yet in a renewal or non-renewal shopping window.',409);

    const handoff=(await all<BindHandoff>('insurance_bind_handoff',householdId)).find(item=>item.id===policy.handoffId);
    if(!handoff)throw new AppError('Original bind handoff not found.',409);
    const source=(await all<QuoteSession>('insurance_quote_session',householdId)).find(session=>session.results.some(result=>result.status==='quoted'&&result.quote.quoteId===handoff.quoteId));
    if(!source)throw new AppError('Original quote context is unavailable. Start a fresh insurance comparison.',409);

    const input:QuoteInput={
      householdId,
      teenId:policy.teenId,
      intent:'compare_current',
      coverageLevel:source.normalizedRequest.coverageLevel,
      vehicles:source.normalizedRequest.vehicles,
      currentPolicy:{
        carrierName:policy.carrierId,
        renewalDate:opportunity.renewalAt||opportunity.nonRenewalAt,
        teenAlreadyListed:true
      },
      shareReadinessEvidence:Boolean(source.normalizedRequest.readiness?.shared)
    };
    const quoteSession=await createQuoteSession(user,input,idempotencyKey);
    await put('insurance_renewal_context',{id:randomUUID(),householdId,ownerId:user.id,policyId,quoteSessionId:quoteSession.id,reason:opportunity.reason,createdAt:new Date().toISOString()});
    await audit(user.id,householdId,'insurance.renewal.reshop','ALLOW','Guardian started a fresh carrier comparison using current policy context; no renewal or switch decision was made automatically.');
    return {opportunity,quoteSession};
  });
}

export async function recordRenewalDecision(
  user:User,
  householdId:string,
  policyId:string,
  quoteSessionId:string,
  decision:'stay'|'switch',
  selectedCarrierId?:string,
  selectedQuoteId?:string
):Promise<RenewalDecision>{
  return transaction(async()=>{
    await guardian(user,householdId);
    const policy=(await all<PolicyRecord>('insurance_policy',householdId)).find(item=>item.id===policyId&&item.ownerId===user.id);
    if(!policy)throw new AppError('Policy not found.',404);
    const session=(await all<QuoteSession>('insurance_quote_session',householdId)).find(item=>item.id===quoteSessionId&&item.ownerId===user.id);
    if(!session)throw new AppError('Renewal comparison not found.',404);
    if(decision==='switch'){
      const quoted=session.results.find(item=>item.status==='quoted'&&item.quote.quoteId===selectedQuoteId&&item.quote.carrierId===selectedCarrierId);
      if(!quoted)throw new AppError('Choose a valid quoted carrier offer before switching.',400);
    }
    const prior=(await all<RenewalDecision>('insurance_renewal_decision',householdId)).find(item=>item.policyId===policyId&&item.quoteSessionId===quoteSessionId&&item.ownerId===user.id);
    if(prior)return prior;
    const value:RenewalDecision={id:randomUUID(),householdId,ownerId:user.id,policyId,quoteSessionId,decision,selectedCarrierId:decision==='switch'?selectedCarrierId:policy.carrierId,selectedQuoteId:decision==='switch'?selectedQuoteId:undefined,createdAt:new Date().toISOString()};
    await put('insurance_renewal_decision',value);
    await audit(user.id,householdId,'insurance.renewal.decision','ALLOW',decision==='stay'?'Guardian chose to stay with the current carrier. Carrier renewal confirmation is still required.':'Guardian chose a new quote. A separate carrier bind handoff is still required.');
    return value;
  });
}
