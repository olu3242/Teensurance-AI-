import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {all,put} from './db';
import {AppError} from './auth';
import {requireReviewer} from './admin';
import {supportedJurisdiction} from './state-experience';
import type {User} from './types';

export type LegalSourceStatus='queued'|'retrieved'|'reviewing'|'accepted'|'rejected'|'superseded';
export type LegalSourceCandidate={
 id:string;householdId:string;ownerId:string;jurisdiction:string;stateName:string;authority:string;
 sourceTitle:string;sourceUrl:string;sourceType:'dmv'|'dot'|'statute'|'regulation'|'official_guidance';
 priority:1|2|3|4|5;status:LegalSourceStatus;effectiveFrom?:string;effectiveTo?:string;
 retrievedAt?:string;reviewedAt?:string;reviewedBy?:string;note:string;createdAt:string;updatedAt:string
};

const sourceInput=z.object({
 jurisdiction:z.string().trim().min(2).max(5),
 authority:z.string().trim().min(2).max(160),
 sourceTitle:z.string().trim().min(3).max(240),
 sourceUrl:z.string().url().refine(v=>v.startsWith('https://'),'Official source must use HTTPS.'),
 sourceType:z.enum(['dmv','dot','statute','regulation','official_guidance']),
 priority:z.number().int().min(1).max(5),
 effectiveFrom:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
 effectiveTo:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
 note:z.string().trim().max(1000).default('')
}).strict();

export async function queueLegalSource(user:User,raw:unknown){
 requireReviewer(user);
 const parsed=sourceInput.safeParse(raw);if(!parsed.success)throw new AppError('Invalid legal-source candidate.',400);
 const input=parsed.data;const state=supportedJurisdiction(input.jurisdiction);
 if(!state)throw new AppError('Legal sources may only be queued for supported U.S. states.',400);
 if(input.effectiveFrom&&input.effectiveTo&&input.effectiveTo<=input.effectiveFrom)throw new AppError('Source effective-to date must follow effective-from date.',400);
 const now=new Date().toISOString();
 const item:LegalSourceCandidate={id:randomUUID(),householdId:'',ownerId:user.id,jurisdiction:state.code,stateName:state.name,authority:input.authority,sourceTitle:input.sourceTitle,sourceUrl:input.sourceUrl,sourceType:input.sourceType,priority:input.priority as 1|2|3|4|5,status:'queued',effectiveFrom:input.effectiveFrom,effectiveTo:input.effectiveTo,note:input.note,createdAt:now,updatedAt:now};
 return put('legal_source_candidate',item);
}

const transitionInput=z.object({id:z.string().uuid(),to:z.enum(['retrieved','reviewing','accepted','rejected','superseded']),note:z.string().trim().min(10).max(1000),humanAttestation:z.boolean()}).strict();
export async function transitionLegalSource(user:User,raw:unknown){
 requireReviewer(user);const parsed=transitionInput.safeParse(raw);if(!parsed.success)throw new AppError('Invalid legal-source transition.',400);
 const input=parsed.data;const records=await all<LegalSourceCandidate>('legal_source_candidate');const item=records.find(x=>x.id===input.id);
 if(!item)throw new AppError('Legal-source candidate not found.',404);
 const allowed:Record<LegalSourceStatus,LegalSourceStatus[]>={queued:['retrieved','rejected'],retrieved:['reviewing','rejected'],reviewing:['accepted','rejected'],accepted:['superseded'],rejected:['reviewing'],superseded:[]};
 if(!allowed[item.status].includes(input.to))throw new AppError('Invalid legal-source transition.',409);
 if(input.to==='accepted'&&!input.humanAttestation)throw new AppError('Human source-review attestation is required before acceptance.',400);
 const now=new Date().toISOString();
 return put('legal_source_candidate',{...item,status:input.to,note:input.note,updatedAt:now,retrievedAt:input.to==='retrieved'?now:item.retrievedAt,reviewedAt:input.to==='accepted'?now:item.reviewedAt,reviewedBy:input.to==='accepted'?user.id:item.reviewedBy});
}

export async function inspectLegalSourceQueue(user:User){
 requireReviewer(user);const items=await all<LegalSourceCandidate>('legal_source_candidate');
 return items.sort((a,b)=>a.priority-b.priority||a.jurisdiction.localeCompare(b.jurisdiction)||a.createdAt.localeCompare(b.createdAt));
}
