import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {all,put,transaction} from './db';
import {AppError} from './auth';
import {requireReviewer} from './admin';
import {audit} from './service';
import type {Rule,User} from './types';
import {jurisdictionRules,normalizeJurisdiction} from './jurisdictions';
import {promotedLegalRules} from './legal-rule-promotion';

export type LegalRuleReviewStatus='draft'|'review'|'approved'|'published'|'superseded'|'retired';
export type LegalRuleReview={
 id:string;householdId:string;ownerId:string;ruleId:string;digest:string;jurisdiction:string;
 version:string;status:LegalRuleReviewStatus;reviewer:string;reviewedAt:string;publishedAt:string;
 note:string;sourceUrl:string;snapshot:Rule
};
export type RuleLifecycleResolution={
 jurisdiction:string;status:'active'|'stale'|'future'|'unpublished'|'superseded'|'unsupported';
 reason:string;rule?:Rule;sourceUrl?:string;version?:string;validUntil?:string
};

export function legalRuleDigest(rule:Rule){return createHash('sha256').update(JSON.stringify(rule)).digest('hex')}
export function legalRuleCatalog(){return jurisdictionRules.map(rule=>({rule,digest:legalRuleDigest(rule)}))}

function reviewFor(rule:Rule,reviews:LegalRuleReview[]){const digest=legalRuleDigest(rule);return reviews.find(r=>r.ruleId===rule.id&&r.digest===digest)}

export function resolveRuleLifecycle(value:string,reviews:LegalRuleReview[]=[],now=new Date()):RuleLifecycleResolution{return resolveRuleLifecycleFromCatalog(value,jurisdictionRules,reviews,now)}
export function resolveRuleLifecycleFromCatalog(value:string,catalog:Rule[],reviews:LegalRuleReview[]=[],now=new Date()):RuleLifecycleResolution{
 const jurisdiction=normalizeJurisdiction(value);const today=now.toISOString().slice(0,10);
 const candidates=catalog.filter(r=>r.jurisdiction===jurisdiction||(r.aliases||[]).includes(value.toUpperCase())).sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom));
 if(!candidates.length)return {jurisdiction,status:'unsupported',reason:'No reviewed legal-rule package exists for this jurisdiction.'};
 const current=candidates.find(r=>r.effectiveFrom<=today&&r.validUntil>now.toISOString());
 if(!current){
  const future=candidates.find(r=>r.effectiveFrom>today);
  const latest=candidates[0];
  return future?{jurisdiction,status:'future',reason:`A reviewed rule package exists but is not effective until ${future.effectiveFrom}.`,sourceUrl:future.sourceUrl,version:future.version,validUntil:future.validUntil}:{jurisdiction,status:'stale',reason:`The latest reviewed rule snapshot expired on ${latest.validUntil.slice(0,10)}. Current legal requirements must be re-verified before Teensurance displays them.`,sourceUrl:latest.sourceUrl,version:latest.version,validUntil:latest.validUntil};
 }
 const review=reviewFor(current,reviews);
 const bootstrap=current.lifecycleStatus||'published';
 const status=review?.status||bootstrap;
 if(status==='superseded'||status==='retired')return {jurisdiction,status:'superseded',reason:'This legal-rule snapshot has been superseded or retired and cannot drive the user experience.',sourceUrl:current.sourceUrl,version:current.version,validUntil:current.validUntil};
 if(status!=='published')return {jurisdiction,status:'unpublished',reason:`The current legal-rule snapshot is in ${status} review state and is not approved for user-facing guidance.`,sourceUrl:current.sourceUrl,version:current.version,validUntil:current.validUntil};
 return {jurisdiction,status:'active',reason:'Current published legal-rule snapshot is within its reviewed effective window.',rule:current,sourceUrl:current.sourceUrl,version:current.version,validUntil:current.validUntil};
}

export async function runtimeRuleResolution(value:string,now=new Date()){const reviews=await all<LegalRuleReview>('legal_rule_review');const promoted=await promotedLegalRules();return resolveRuleLifecycleFromCatalog(value,[...jurisdictionRules,...promoted],reviews,now)}
export async function runtimeRules(now=new Date()){const reviews=await all<LegalRuleReview>('legal_rule_review');return jurisdictionRules.filter(r=>resolveRuleLifecycle(r.jurisdiction,reviews,now).rule?.id===r.id)}

export async function inspectLegalRules(user:User){requireReviewer(user);const reviews=await all<LegalRuleReview>('legal_rule_review');return legalRuleCatalog().map(({rule,digest})=>({rule,digest,review:reviewFor(rule,reviews)||null,resolution:resolveRuleLifecycle(rule.jurisdiction,reviews)}))}

const input=z.object({ruleId:z.string().min(1),digest:z.string().length(64),to:z.enum(['review','approved','published','superseded','retired']),note:z.string().trim().min(10).max(1000),humanAttestation:z.boolean()}).strict();
export async function changeLegalRuleReview(user:User,raw:unknown){requireReviewer(user);const parsed=input.safeParse(raw);if(!parsed.success)throw new AppError('Invalid legal-rule review request.',400);const c=parsed.data;
 return transaction(async()=>{const entry=legalRuleCatalog().find(e=>e.rule.id===c.ruleId&&e.digest===c.digest);if(!entry)throw new AppError('Legal-rule version changed. Reload review.',409);
  const records=await all<LegalRuleReview>('legal_rule_review');const old=records.find(r=>r.ruleId===c.ruleId&&r.digest===c.digest);const from=old?.status||'draft';
  const allowed:Record<LegalRuleReviewStatus,LegalRuleReviewStatus[]>={draft:['review'],review:['approved','retired'],approved:['published','retired'],published:['superseded','retired'],superseded:[],retired:['review']};
  if(!allowed[from].includes(c.to))throw new AppError('Invalid legal-rule review transition.',409);
  if((c.to==='approved'||c.to==='published')&&!c.humanAttestation)throw new AppError('Human source review attestation is required.',400);
  if(c.to==='published'&&entry.rule.validUntil<=new Date().toISOString())throw new AppError('Expired legal rules cannot be published. Create and review a new rule version.',409);
  const now=new Date().toISOString();const result:LegalRuleReview={id:`legal-rule:${c.ruleId}:${c.digest}`,householdId:'',ownerId:old?.ownerId||user.id,ruleId:c.ruleId,digest:c.digest,jurisdiction:entry.rule.jurisdiction,version:entry.rule.version,status:c.to,reviewer:(c.to==='approved'||c.to==='published')?user.id:old?.reviewer||'',reviewedAt:c.to==='approved'?now:old?.reviewedAt||'',publishedAt:c.to==='published'?now:old?.publishedAt||'',note:c.note,sourceUrl:entry.rule.sourceUrl,snapshot:entry.rule};
  await put('legal_rule_review',result);await put('legal_rule_review_event',{...result,id:randomUUID(),ownerId:user.id,from,at:now});await audit(user.id,'','legal_rule.review','ALLOW',`${from} to ${c.to}; digest-bound legal-rule transition.`);return result;
 });
}
