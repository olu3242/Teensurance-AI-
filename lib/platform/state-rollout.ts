import type {Rule} from './types';
import type {LegalRuleReview,RuleLifecycleResolution} from './legal-rule-lifecycle';
import {resolveRuleLifecycle} from './legal-rule-lifecycle';
import {jurisdictionRules} from './jurisdictions';
import {supportedJurisdictions} from './state-experience';

export type StateRolloutStatus='pending'|'sourced'|'review'|'approved'|'published'|'stale'|'superseded';
export type StateRolloutItem={
 code:string;name:string;status:StateRolloutStatus;selectable:true;legalGuidanceReady:boolean;
 version?:string;sourceUrl?:string;validUntil?:string;reason:string
};
export type StateRolloutSummary={total:number;published:number;pending:number;needsAttention:number;coveragePercent:number};

function latestRule(code:string,rules:Rule[]){return rules.filter(r=>r.jurisdiction===code).sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom))[0]}
function reviewFor(rule:Rule|undefined,reviews:LegalRuleReview[]){if(!rule)return undefined;return reviews.filter(r=>r.ruleId===rule.id).sort((a,b)=>(b.publishedAt||b.reviewedAt||'').localeCompare(a.publishedAt||a.reviewedAt||''))[0]}

function statusFor(rule:Rule|undefined,review:LegalRuleReview|undefined,resolution:RuleLifecycleResolution):StateRolloutStatus{
 if(!rule)return 'pending';
 if(resolution.status==='active')return 'published';
 if(resolution.status==='stale'||resolution.status==='future')return 'stale';
 if(resolution.status==='superseded')return 'superseded';
 if(review?.status==='approved')return 'approved';
 if(review?.status==='review')return 'review';
 return 'sourced';
}

export function stateRolloutManifest(reviews:LegalRuleReview[]=[],now=new Date(),rules=jurisdictionRules):StateRolloutItem[]{
 return supportedJurisdictions.map(state=>{
  const rule=latestRule(state.code,rules);
  const review=reviewFor(rule,reviews);
  const resolution=resolveRuleLifecycle(state.code,reviews,now);
  const status=statusFor(rule,review,resolution);
  return {
   code:state.code,name:state.name,status,selectable:true,
   legalGuidanceReady:resolution.status==='active',
   version:rule?.version,sourceUrl:rule?.sourceUrl,validUntil:rule?.validUntil,
   reason:rule?resolution.reason:'No governed legal-rule package has been sourced and added yet.'
  };
 });
}

export function stateRolloutSummary(items:StateRolloutItem[]):StateRolloutSummary{
 const published=items.filter(x=>x.legalGuidanceReady).length;
 const pending=items.filter(x=>x.status==='pending').length;
 const needsAttention=items.filter(x=>['stale','superseded'].includes(x.status)).length;
 return {total:items.length,published,pending,needsAttention,coveragePercent:items.length?Math.round(published/items.length*100):0};
}
