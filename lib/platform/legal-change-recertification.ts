import {randomUUID} from 'node:crypto';
import {all,put} from './db';
import {requireReviewer} from './admin';
import type {User,Rule} from './types';
import type {LegalSourceCandidate} from './legal-source-queue';
import type {PromotedLegalRule} from './legal-rule-promotion';

export type LegalChangeReason='source_superseded'|'source_rejected'|'source_expired'|'rule_expired'|'source_missing';
export type LegalRecertificationImpact={
 id:string;householdId:string;ownerId:string;jurisdiction:string;ruleId:string;version:string;
 status:'open'|'resolved';reasons:LegalChangeReason[];sourceIds:string[];
 affected:['state_experience','journey','passport','scout','roadready'];
 detectedAt:string;resolvedAt?:string;note:string
};

export function assessPromotedRule(promoted:PromotedLegalRule,sources:LegalSourceCandidate[],now=new Date()){
 const reasons:LegalChangeReason[]=[];const byId=new Map(sources.map(s=>[s.id,s]));const today=now.toISOString().slice(0,10);
 for(const sourceId of promoted.sourceIds){
  const source=byId.get(sourceId);
  if(!source){reasons.push('source_missing');continue}
  if(source.status==='superseded')reasons.push('source_superseded');
  if(source.status==='rejected')reasons.push('source_rejected');
  if(source.effectiveTo&&source.effectiveTo<=today)reasons.push('source_expired');
 }
 if(promoted.rule.validUntil<=now.toISOString())reasons.push('rule_expired');
 return [...new Set(reasons)];
}

export function runtimeEligiblePromotedRules(promoted:PromotedLegalRule[],sources:LegalSourceCandidate[],now=new Date()):Rule[]{
 return promoted.filter(p=>assessPromotedRule(p,sources,now).length===0).map(p=>p.rule);
}

export async function scanLegalChanges(user:User,now=new Date()){
 requireReviewer(user);
 const [promoted,sources,existing]=await Promise.all([
  all<PromotedLegalRule>('promoted_legal_rule'),
  all<LegalSourceCandidate>('legal_source_candidate'),
  all<LegalRecertificationImpact>('legal_recertification_impact')
 ]);
 const impacts:LegalRecertificationImpact[]=[];
 for(const item of promoted){
  const reasons=assessPromotedRule(item,sources,now);const old=existing.find(x=>x.ruleId===item.rule.id&&x.status==='open');
  if(reasons.length){
   const impact:LegalRecertificationImpact={id:old?.id||randomUUID(),householdId:'',ownerId:user.id,jurisdiction:item.jurisdiction,ruleId:item.rule.id,version:item.version,status:'open',reasons,sourceIds:item.sourceIds,affected:['state_experience','journey','passport','scout','roadready'],detectedAt:old?.detectedAt||now.toISOString(),note:'Legal source or rule validity changed. Downstream legal guidance must remain fail-closed until human recertification.'};
   await put('legal_recertification_impact',impact);impacts.push(impact);
  }else if(old){
   const resolved={...old,status:'resolved' as const,resolvedAt:now.toISOString(),note:'Source and rule validity checks are clear; separate legal-rule lifecycle approval still governs publication.'};
   await put('legal_recertification_impact',resolved);impacts.push(resolved);
  }
 }
 return impacts;
}

export async function inspectLegalRecertification(user:User){
 requireReviewer(user);return all<LegalRecertificationImpact>('legal_recertification_impact');
}
