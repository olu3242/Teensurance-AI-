import {all} from '../platform/db';
import {AppError} from '../platform/auth';
import type {Member,Profile,User} from '../platform/types';
import type {QuoteSession} from './types';
import type {BindHandoff,PolicyRecord} from './bind';

export type PolicyDocument={kind:'declarations'|'id_card'|'policy'|'endorsement'|'cancellation_notice'|'renewal_notice';label:string;externalUrl?:string;available:boolean};
export type PolicyLifecycleView={policyId:string;carrierId:string;externalPolicyId:string;teenId:string;teenName:string;status:PolicyRecord['status']|'NON_RENEWAL_PENDING';effectiveAt?:string;renewalAt?:string;cancellationAt?:string;nonRenewalAt?:string;coveredVehicles:{year:number;make:string;model:string;vinLast4?:string}[];documents:PolicyDocument[];timeline:{state:string;at:string;source:'carrier'|'teensurance'}[];attention?:string};

async function guardian(user:User,householdId:string){const member=(await all<Member>('member',householdId)).find(item=>item.ownerId===user.id&&item.active);if(!member||member.role!=='guardian')throw new AppError('Guardian insurance access required.',403)}
function last4(vin?:string){return vin?vin.slice(-4):undefined}

export async function parentInsuranceDashboard(user:User,householdId:string){
 await guardian(user,householdId);
 const policies=(await all<PolicyRecord>('insurance_policy',householdId)).filter(item=>item.ownerId===user.id);
 const handoffs=(await all<BindHandoff>('insurance_bind_handoff',householdId)).filter(item=>item.ownerId===user.id);
 const profiles=await all<Profile>('profile',householdId);
 const sessions=await all<QuoteSession>('insurance_quote_session',householdId);
 const carrierEvents=await all<{event:{externalReference:string;type:string;occurredAt:string;renewalAt?:string;cancellationAt?:string;nonRenewalAt?:string;documents?:PolicyDocument[]}}>('insurance_carrier_event',householdId);
 const views:PolicyLifecycleView[]=policies.map(policy=>{
  const handoff=handoffs.find(item=>item.id===policy.handoffId);
  const quoteSession=handoff?sessions.find(session=>session.results.some(result=>result.status==='quoted'&&result.quote.quoteId===handoff.quoteId)):undefined;
  const teen=profiles.find(profile=>profile.ownerId===policy.teenId);
  const latest=handoff?carrierEvents.filter(item=>item.event.externalReference===handoff.externalReference).map(item=>item.event):[];
  const renewalAt=latest.map(event=>event.renewalAt).filter((value):value is string=>Boolean(value)).sort().at(-1);
  const cancellationAt=latest.map(event=>event.cancellationAt).filter((value):value is string=>Boolean(value)).sort().at(-1);
  const nonRenewalAt=latest.map(event=>event.nonRenewalAt).filter((value):value is string=>Boolean(value)).sort().at(-1);
  const documents=latest.flatMap(event=>event.documents||[]);
  const status=nonRenewalAt&&policy.status==='ACTIVE'?'NON_RENEWAL_PENDING':policy.status;
  const attention=status==='NON_RENEWAL_PENDING'?'Carrier reported a pending non-renewal. Review the carrier notice and shop before the policy end date.':policy.status==='CANCELLED'?'Carrier reported this policy as cancelled. Confirm replacement coverage directly with the carrier before driving.':undefined;
  return {policyId:policy.id,carrierId:policy.carrierId,externalPolicyId:policy.externalPolicyId,teenId:policy.teenId,teenName:teen?.name||'Teen driver',status,effectiveAt:policy.effectiveAt,renewalAt,cancellationAt,nonRenewalAt,coveredVehicles:(quoteSession?.normalizedRequest.vehicles||[]).map(vehicle=>({year:vehicle.year,make:vehicle.make,model:vehicle.model,vinLast4:last4(vehicle.vin)})),documents:documents.length?documents:[{kind:'declarations',label:'Declarations page',available:false},{kind:'id_card',label:'Insurance ID card',available:false},{kind:'policy',label:'Policy documents',available:false}],timeline:[...(handoff?[{state:'HANDOFF_READY',at:handoff.createdAt,source:'teensurance' as const}]:[]),...latest.map(event=>({state:event.type,at:event.occurredAt,source:'carrier' as const}))].sort((a,b)=>a.at.localeCompare(b.at)),attention};
 });
 return {householdId,policies:views,activeCount:views.filter(item=>item.status==='ACTIVE').length,attentionCount:views.filter(item=>Boolean(item.attention)).length,disclaimer:'Policy status is shown from carrier-confirmed events. Teensurance does not create, alter, cancel, renew, or reinstate insurance coverage.'};
}
