import {randomUUID} from 'node:crypto';
import {all,put,transaction} from './db';
import {AppError} from './auth';
import {requireReviewer} from './admin';
import type {Rule,User} from './types';
import type {LegalRuleDraft} from './legal-rule-drafting';
import type {LegalSourceCandidate} from './legal-source-queue';

export type PromotedLegalRule={
 id:string;householdId:string;ownerId:string;draftId:string;jurisdiction:string;version:string;
 sourceIds:string[];promotedAt:string;promotedBy:string;rule:Rule;
 provenance:{requirementId:string;sourceId:string;sourceUrl:string;sourceTitle:string;authority:string;citationNote:string}[]
};

export async function promotedLegalRuleRecords(){return all<PromotedLegalRule>('promoted_legal_rule')}
export async function promotedLegalRules(){
 const records=await promotedLegalRuleRecords();const sources=await all<LegalSourceCandidate>('legal_source_candidate');
 const {runtimeEligiblePromotedRules}=await import('./legal-change-recertification');
 return runtimeEligiblePromotedRules(records,sources);
}

export async function promoteLegalRuleDraft(user:User,draftId:string,humanAttestation:boolean){
 requireReviewer(user);if(!humanAttestation)throw new AppError('Human promotion attestation is required.',400);
 return transaction(async()=>{
  const draft=(await all<LegalRuleDraft>('legal_rule_draft')).find(d=>d.id===draftId);
  if(!draft)throw new AppError('Legal rule draft not found.',404);
  if(draft.status!=='ready_for_rule_review')throw new AppError('Draft must be ready for rule review before promotion.',409);
  const sources=await all<LegalSourceCandidate>('legal_source_candidate');const byId=new Map(sources.map(s=>[s.id,s]));
  if(draft.requirements.some(r=>byId.get(r.sourceId)?.status!=='accepted'))throw new AppError('All cited sources must remain accepted at promotion time.',409);
  const existing=(await all<PromotedLegalRule>('promoted_legal_rule')).find(x=>x.jurisdiction===draft.jurisdiction&&x.version===draft.version);
  if(existing)return existing;
  const primary=byId.get(draft.sourceIds[0]);if(!primary)throw new AppError('Primary accepted source is missing.',409);
  const now=new Date().toISOString();
  const rule:Rule={
   id:`${draft.jurisdiction.toLowerCase()}-promoted-${draft.version}`,householdId:'public',ownerId:'content',
   jurisdiction:draft.jurisdiction,stateName:draft.stateName,
   legalRequirements:draft.requirements.map(({sourceId:_,sourceUrl:__,sourceTitle:___,authority:____,citationNote:_____,...requirement})=>requirement),
   aliases:[`US-${draft.jurisdiction}`],version:draft.version,sourceUrl:primary.sourceUrl,sourceTitle:primary.sourceTitle,
   reviewedAt:now,validUntil:draft.validUntil,effectiveFrom:draft.effectiveFrom,learnerMinimumAge:draft.learnerMinimumAge,
   minimumAge:draft.minimumAge,holdingMonths:draft.holdingMonths,totalMinutes:draft.totalMinutes,nightMinutes:draft.nightMinutes,
   weatherMinutes:draft.weatherMinutes,requiredEvidence:draft.requiredEvidence,authorityLabel:primary.authority,status:'verified',
   lifecycleStatus:'draft',reviewedBy:'Promoted from provenance-attested legal rule draft'
  };
  const promoted:PromotedLegalRule={id:randomUUID(),householdId:'',ownerId:user.id,draftId:draft.id,jurisdiction:draft.jurisdiction,version:draft.version,sourceIds:draft.sourceIds,promotedAt:now,promotedBy:user.id,rule,provenance:draft.requirements.map(r=>({requirementId:r.id,sourceId:r.sourceId,sourceUrl:r.sourceUrl,sourceTitle:r.sourceTitle,authority:r.authority,citationNote:r.citationNote}))};
  await put('promoted_legal_rule',promoted);
  await put('legal_rule_promotion_event',{...promoted,id:randomUUID(),ownerId:user.id,at:now});
  return promoted;
 });
}
