import {randomUUID} from 'node:crypto';
import {all,put} from '../platform/db';
import {AppError} from '../platform/auth';
import type {Member,User} from '../platform/types';
import type {QuoteSession} from './types';
import type {BindHandoff,PolicyRecord} from './bind';
import type {SavingsEvidence} from './value';
import type {SavingsMilestone} from './value-dashboard';

export type InsuranceNotificationKind=
  |'renewal_approaching'|'non_renewal'|'quote_expiring'|'bind_incomplete'
  |'policy_activated'|'policy_cancelled'|'new_realized_savings'|'value_milestone'|'insurance_preparation';

export type InsuranceNotification={
  id:string;
  householdId:string;
  ownerId:string;
  kind:InsuranceNotificationKind;
  subjectId:string;
  title:string;
  message:string;
  cta:{label:string;href:string};
  priority:'normal'|'high';
  status:'unread'|'read'|'dismissed';
  dedupeKey:string;
  createdAt:string;
  expiresAt?:string;
};

async function guardian(user:User,householdId:string){
  const member=(await all<Member>('member',householdId)).find(item=>item.ownerId===user.id&&item.active);
  if(!member||member.role!=='guardian')throw new AppError('Guardian insurance access required.',403);
}

function daysBetween(a:string,b=new Date()){return Math.ceil((Date.parse(a)-b.getTime())/86400000)}
function hoursSince(a:string,b=new Date()){return (b.getTime()-Date.parse(a))/3600000}

export async function generateInsuranceNotifications(user:User,householdId:string,now=new Date()){
  await guardian(user,householdId);
  const existing=(await all<InsuranceNotification>('insurance_notification',householdId)).filter(item=>item.ownerId===user.id);
  const proposals:Omit<InsuranceNotification,'id'|'status'|'createdAt'>[]=[];
  const policies=(await all<PolicyRecord>('insurance_policy',householdId)).filter(item=>item.ownerId===user.id);
  const handoffs=(await all<BindHandoff>('insurance_bind_handoff',householdId)).filter(item=>item.ownerId===user.id);
  const quotes=(await all<QuoteSession>('insurance_quote_session',householdId)).filter(item=>item.ownerId===user.id);
  const events=await all<{event:{externalReference:string;type:string;occurredAt:string;renewalAt?:string;nonRenewalAt?:string}}>('insurance_carrier_event',householdId);
  const savings=(await all<SavingsEvidence>('insurance_savings_evidence',householdId)).filter(item=>item.ownerId===user.id&&item.kind==='realized');
  const milestones=(await all<SavingsMilestone&{ownerId:string}>('insurance_value_milestone',householdId)).filter(item=>item.ownerId===user.id);
  const preparation=(await all<{id:string;ownerId:string;teenId:string;state:string;generatedAt:string}>('insurance_preparation_opportunity',householdId)).filter(item=>item.ownerId===user.id&&item.state!=='EARLY');

  for(const policy of policies){
    const handoff=handoffs.find(item=>item.id===policy.handoffId);
    const related=handoff?events.filter(item=>item.event.externalReference===handoff.externalReference).map(item=>item.event):[];
    const renewalAt=related.map(e=>e.renewalAt).filter((v):v is string=>Boolean(v)).sort().at(-1);
    const nonRenewalAt=related.map(e=>e.nonRenewalAt).filter((v):v is string=>Boolean(v)).sort().at(-1);
    if(nonRenewalAt&&daysBetween(nonRenewalAt,now)>=0){
      proposals.push({householdId,ownerId:user.id,kind:'non_renewal',subjectId:policy.id,title:'Carrier reported non-renewal',message:'Review the carrier notice and compare replacement coverage before the policy end date.',cta:{label:'Compare replacement coverage',href:'/parent/insurance?householdId='+householdId},priority:'high',dedupeKey:'non-renewal:'+policy.id+':'+nonRenewalAt,expiresAt:nonRenewalAt});
    }else if(renewalAt){
      const d=daysBetween(renewalAt,now);
      if(d>=0&&d<=45)proposals.push({householdId,ownerId:user.id,kind:'renewal_approaching',subjectId:policy.id,title:'Policy renewal is approaching',message:'Your carrier-reported renewal date is approaching. You can review the current policy and compare fresh quotes.',cta:{label:'Review renewal options',href:'/parent/insurance?householdId='+householdId},priority:d<=14?'high':'normal',dedupeKey:'renewal:'+policy.id+':'+renewalAt,expiresAt:renewalAt});
    }
    if(policy.status==='ACTIVE')proposals.push({householdId,ownerId:user.id,kind:'policy_activated',subjectId:policy.id,title:'Coverage is active',message:'The carrier confirmed this policy as active.',cta:{label:'View policy',href:'/parent/insurance?householdId='+householdId},priority:'normal',dedupeKey:'active:'+policy.id+':'+policy.confirmedAt});
    if(policy.status==='CANCELLED')proposals.push({householdId,ownerId:user.id,kind:'policy_cancelled',subjectId:policy.id,title:'Carrier reported cancellation',message:'Review the carrier notice and confirm replacement coverage before driving.',cta:{label:'Review coverage',href:'/parent/insurance?householdId='+householdId},priority:'high',dedupeKey:'cancelled:'+policy.id+':'+policy.confirmedAt});
  }

  for(const quote of quotes){
    const expiries=quote.results.filter((r):r is Extract<typeof r,{status:'quoted'}>=>r.status==='quoted').map(r=>r.quote.expiresAt).filter(x=>Date.parse(x)>now.getTime()).sort();
    const nearest=expiries[0];
    if(nearest&&daysBetween(nearest,now)<=2)proposals.push({householdId,ownerId:user.id,kind:'quote_expiring',subjectId:quote.id,title:'Insurance quote is expiring',message:'One or more carrier quotes will expire soon. Recheck pricing before relying on an expired offer.',cta:{label:'Review quotes',href:'/parent/insurance?householdId='+householdId},priority:'normal',dedupeKey:'quote-expiring:'+quote.id+':'+nearest,expiresAt:nearest});
  }

  for(const handoff of handoffs){
    if(['HANDOFF_READY','HANDOFF_STARTED','CARRIER_REVIEW'].includes(handoff.state)&&hoursSince(handoff.updatedAt,now)>=24){
      proposals.push({householdId,ownerId:user.id,kind:'bind_incomplete',subjectId:handoff.id,title:'Insurance purchase is still in progress',message:'The carrier has not yet confirmed active coverage. Check the carrier handoff before assuming the policy is active.',cta:{label:'Check bind status',href:'/parent/insurance?householdId='+householdId},priority:'high',dedupeKey:'bind-incomplete:'+handoff.id+':'+handoff.state});
    }
  }

  for(const item of savings){
    if(item.savingsCents>0)proposals.push({householdId,ownerId:user.id,kind:'new_realized_savings',subjectId:item.id,title:'New carrier-confirmed value evidence',message:'A new realized premium comparison is available from carrier-confirmed policy evidence.',cta:{label:'View insurance value',href:'/parent/insurance?householdId='+householdId},priority:'normal',dedupeKey:'savings:'+item.id});
  }

  for(const item of preparation){
    proposals.push({householdId,ownerId:user.id,kind:'insurance_preparation',subjectId:item.teenId,title:'Review teen insurance preparation',message:'A new insurance preparation opportunity is available. Readiness evidence is advisory and does not determine insurance eligibility or pricing.',cta:{label:'Review insurance preparation',href:'/parent/insurance?householdId='+householdId},priority:'normal',dedupeKey:'insurance-preparation:'+item.id});
  }

  for(const item of milestones){
    proposals.push({householdId,ownerId:user.id,kind:'value_milestone',subjectId:item.id,title:'Insurance value milestone reached',message:item.label,cta:{label:'View milestone',href:'/parent/insurance?householdId='+householdId},priority:'normal',dedupeKey:'milestone:'+item.id});
  }

  const created:InsuranceNotification[]=[];
  for(const proposal of proposals){
    if(existing.some(item=>item.dedupeKey===proposal.dedupeKey))continue;
    const notification:InsuranceNotification={...proposal,id:randomUUID(),status:'unread',createdAt:now.toISOString()};
    await put('insurance_notification',notification);existing.push(notification);created.push(notification);
  }
  return {created,notifications:existing.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),suppressed:proposals.length-created.length};
}

export async function updateInsuranceNotification(user:User,householdId:string,id:string,status:'read'|'dismissed'){
  await guardian(user,householdId);
  const current=(await all<InsuranceNotification>('insurance_notification',householdId)).find(item=>item.id===id&&item.ownerId===user.id);
  if(!current)throw new AppError('Notification not found.',404);
  const updated={...current,status};
  await put('insurance_notification',updated);
  return updated;
}
