import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {all,put} from './db';
import {AppError} from './auth';
import {requireReviewer} from './admin';
import type {LegalRequirement,User} from './types';
import type {LegalSourceCandidate} from './legal-source-queue';

export type DraftRequirement=LegalRequirement&{sourceId:string;sourceUrl:string;sourceTitle:string;authority:string;citationNote:string};
export type LegalRuleDraft={
 id:string;householdId:string;ownerId:string;jurisdiction:string;stateName:string;status:'draft'|'ready_for_rule_review';
 sourceIds:string[];requirements:DraftRequirement[];version:string;effectiveFrom:string;validUntil:string;
 learnerMinimumAge?:number;minimumAge:number;holdingMonths:number;totalMinutes:number;nightMinutes:number;weatherMinutes?:number;
 requiredEvidence:string[];createdAt:string;updatedAt:string
};

const requirement=z.object({id:z.string().trim().min(2).max(120),kind:z.enum(['age','holding_period','practice','education','test','documents','restriction','insurance']),label:z.string().trim().min(5).max(500),stages:z.array(z.enum(['pre-permit','permit','licensed'])).optional(),sourceId:z.string().uuid(),citationNote:z.string().trim().min(5).max(1000)}).strict();
const input=z.object({
 jurisdiction:z.string().trim().length(2),version:z.string().trim().min(1).max(80),effectiveFrom:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),validUntil:z.string().datetime(),
 learnerMinimumAge:z.number().min(0).max(25).optional(),minimumAge:z.number().min(0).max(25),holdingMonths:z.number().int().min(0).max(60),
 totalMinutes:z.number().int().min(0),nightMinutes:z.number().int().min(0),weatherMinutes:z.number().int().min(0).optional(),
 requiredEvidence:z.array(z.string().trim().min(1).max(120)).max(30),requirements:z.array(requirement).min(1).max(100)
}).strict();

export async function saveLegalRuleDraft(user:User,raw:unknown){
 requireReviewer(user);const parsed=input.safeParse(raw);if(!parsed.success)throw new AppError('Invalid legal rule draft.',400);const value=parsed.data;
 if(value.nightMinutes>value.totalMinutes||(value.weatherMinutes||0)>value.totalMinutes)throw new AppError('Practice subsets cannot exceed total practice.',400);
 const sources=await all<LegalSourceCandidate>('legal_source_candidate');const byId=new Map(sources.map(s=>[s.id,s]));
 const accepted=value.requirements.map(r=>byId.get(r.sourceId));
 if(accepted.some(s=>!s||s.status!=='accepted'))throw new AppError('Every requirement must cite an accepted official source.',409);
 if(accepted.some(s=>s!.jurisdiction!==value.jurisdiction))throw new AppError('Requirement sources must match the draft jurisdiction.',409);
 const stateName=accepted[0]!.stateName;const now=new Date().toISOString();
 const requirements:DraftRequirement[]=value.requirements.map(r=>{const s=byId.get(r.sourceId)!;return {...r,sourceUrl:s.sourceUrl,sourceTitle:s.sourceTitle,authority:s.authority}});
 const existing=(await all<LegalRuleDraft>('legal_rule_draft')).find(d=>d.jurisdiction===value.jurisdiction&&d.version===value.version);
 const draft:LegalRuleDraft={id:existing?.id||randomUUID(),householdId:'',ownerId:user.id,jurisdiction:value.jurisdiction,stateName,status:'draft',sourceIds:[...new Set(requirements.map(r=>r.sourceId))],requirements,version:value.version,effectiveFrom:value.effectiveFrom,validUntil:value.validUntil,learnerMinimumAge:value.learnerMinimumAge,minimumAge:value.minimumAge,holdingMonths:value.holdingMonths,totalMinutes:value.totalMinutes,nightMinutes:value.nightMinutes,weatherMinutes:value.weatherMinutes,requiredEvidence:value.requiredEvidence,createdAt:existing?.createdAt||now,updatedAt:now};
 return put('legal_rule_draft',draft);
}

export async function markLegalRuleDraftReady(user:User,id:string,humanAttestation:boolean){
 requireReviewer(user);if(!humanAttestation)throw new AppError('Human provenance attestation is required.',400);
 const drafts=await all<LegalRuleDraft>('legal_rule_draft');const draft=drafts.find(d=>d.id===id);if(!draft)throw new AppError('Legal rule draft not found.',404);
 const sources=await all<LegalSourceCandidate>('legal_source_candidate');const accepted=new Set(sources.filter(s=>s.status==='accepted').map(s=>s.id));
 if(draft.requirements.some(r=>!accepted.has(r.sourceId)))throw new AppError('Draft contains a source that is no longer accepted.',409);
 return put('legal_rule_draft',{...draft,status:'ready_for_rule_review' as const,updatedAt:new Date().toISOString()});
}

export async function inspectLegalRuleDrafts(user:User){requireReviewer(user);return all<LegalRuleDraft>('legal_rule_draft')}
