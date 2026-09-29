import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {all,put,transaction} from '../platform/db';
import {AppError} from '../platform/auth';
import {requireReviewer} from '../platform/admin';
import {audit} from '../platform/service';
import type {User} from '../platform/types';
import {concepts,challenges} from './content';
import {hazardScenes} from './core/hazards';
import {contentVisibility,requiresHumanReview} from './review-context';
import type {ContentStatus} from './governance';
type Review={id:string;householdId:string;ownerId:string;itemId:string;digest:string;status:ContentStatus;reviewer:string;reviewedAt:string;version:string;sourceUrl:string;note:string;snapshot:unknown};
export function reviewCatalog(){return [...concepts.map(c=>({...c,questions:challenges.filter(q=>q.conceptId===c.id)})),...hazardScenes].map(item=>({item,digest:createHash('sha256').update(JSON.stringify(item)).digest('hex')}))}
export async function withGovernedContent<T>(fn:()=>T|Promise<T>):Promise<T>{if(!requiresHumanReview())return fn();const records=await all<Review>('content_review');const visible=new Set(reviewCatalog().filter(({item,digest})=>records.some(r=>r.itemId===item.id&&r.digest===digest&&r.status==='published'&&!!r.reviewer&&!!r.reviewedAt)).map(c=>c.item.id));return contentVisibility.run(visible,fn)}
export async function inspectReviews(user:User){requireReviewer(user);const states=await all<Review>('content_review');return reviewCatalog().map(({item,digest})=>({id:item.id,name:'name'in item?item.name:item.title,jurisdiction:item.jurisdiction,version:item.version,sourceUrl:item.sourceUrl,digest,content:item,review:states.find(r=>r.itemId===item.id&&r.digest===digest)||null}))}
const input=z.object({itemId:z.string(),digest:z.string().length(64),to:z.enum(['review','approved','published','retired']),note:z.string().trim().min(10).max(1000),humanAttestation:z.boolean()}).strict();
export async function changeReview(user:User,raw:unknown){requireReviewer(user);const parsed=input.safeParse(raw);if(!parsed.success)throw new AppError('Invalid review request.');const c=parsed.data;return transaction(async()=>{const entry=reviewCatalog().find(e=>e.item.id===c.itemId&&e.digest===c.digest);if(!entry)throw new AppError('Content version changed. Reload review.',409);const old=(await all<Review>('content_review')).find(r=>r.itemId===c.itemId&&r.digest===c.digest);const from=old?.status||'draft';const allowed:Record<ContentStatus,string[]>={draft:['review'],review:['approved','retired'],approved:['published','retired'],published:['retired'],retired:['review']};if(!allowed[from].includes(c.to))throw new AppError('Invalid review transition.',409);if(c.to==='approved'&&!c.humanAttestation)throw new AppError('Actual human source review must be confirmed.',400);
 const result:Review={id:`review:${c.itemId}:${c.digest}`,householdId:'',ownerId:old?.ownerId||user.id,itemId:c.itemId,digest:c.digest,status:c.to,reviewer:c.to==='approved'?user.id:old?.reviewer||'',reviewedAt:c.to==='approved'?new Date().toISOString():old?.reviewedAt||'',version:entry.item.version,sourceUrl:entry.item.sourceUrl,note:c.note,snapshot:entry.item};
 await put('content_review',result);await put('content_review_event',{...result,id:randomUUID(),ownerId:user.id,from,at:new Date().toISOString()});await audit(user.id,'','content.review','ALLOW',`${from} to ${c.to}; digest-bound review transition.`);return result})}
