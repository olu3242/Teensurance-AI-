import {requirePilotAccess} from '../pilot/access';
import {withGovernedContent} from './review-service';
const transaction=<T>(fn:()=>T|Promise<T>)=>domainTransaction(()=>withGovernedContent(fn));
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {authorizeLearner} from '../platform/authorization';
import {AppError,hash} from '../platform/auth';
import {all,db,get,owned,put,transaction as domainTransaction} from '../platform/db';
import {audit} from '../platform/service';
import {ageOn} from '../platform/journey';
import type {User} from '../platform/types';
import {migrateRoadReady} from '../platform/migrations/002-roadready';
import {migrateIntelligence} from '../platform/migrations/003-intelligence';
import {jurisdictionPack} from './content';
import {resolveHazards,publicHazard,assessHazard} from './core/hazards';
import {chooseScout,keepRecommendation} from './scout';
import {learnerEvidence,recordLearning,projectMastery} from './intelligence-evidence';
import {mastery,observationGapMs} from './rules';
import type {GuardianReinforcement} from './types';
import {safeContexts,type PracticeSession,type PracticeAttempt,type Recommendation,type CoachActivity} from './intelligence-types';
const scope={householdId:z.string().uuid(),teenId:z.string().uuid(),context:z.enum(safeContexts)};
const command=z.discriminatedUnion('action',[
 z.object({...scope,action:z.literal('start'),kind:z.enum(['hazard','permit','review']),itemId:z.string().optional(),recommendationId:z.string().uuid().optional()}).strict(),
 z.object({...scope,action:z.literal('answer'),sessionId:z.string().uuid(),itemId:z.string(),answerId:z.string(),targets:z.array(z.string()).max(10).optional()}).strict(),
 z.object({...scope,action:z.literal('coach_start'),conceptId:z.string()}).strict(),
 z.object({...scope,action:z.literal('coach_complete'),activityId:z.string().uuid(),completed:z.boolean()}).strict(),
 z.object({...scope,action:z.literal('dismiss'),recommendationId:z.string().uuid()}).strict(),
]);
const now=()=>new Date().toISOString();
const base=(householdId:string,ownerId:string)=>({id:randomUUID(),householdId,ownerId});
function deny(message='Learning access denied.',status=403):never{throw new AppError(message,status)}
async function context(user:User,householdId:string,teenId:string){
 if(process.env.SCOUT_LEARNING_ENABLED!=='true'&&process.env.ROADREADY_LEARNING_ENABLED!=='true')deny('Scout Learning is disabled.',404);
 const ctx=(await authorizeLearner(user,householdId,teenId));
 await requirePilotAccess(householdId);
 if(ageOn(ctx.profile.birthDate)<18&&!ctx.profile.consent)deny('Guardian consent is required.');
 if((await db().prepare("SELECT 1 FROM records WHERE kind='drive' AND json_extract(payload,'$.status')='active' AND (json_extract(payload,'$.teenId') IN (?,?) OR json_extract(payload,'$.supervisorId')=?) LIMIT 1").get(teenId,user.id,user.id)))deny('Resume learning after parking.');
 (await migrateRoadReady(db()));(await migrateIntelligence(db()));
 return {...ctx,jurisdiction:ctx.profile.jurisdiction==='TX'?'US-TX':ctx.profile.jurisdiction};
}
async function event(householdId:string,teenId:string,name:string){(await put('roadready_event',{...base(householdId,teenId),name,at:now()}))}
function catalog(ctx:Awaited<ReturnType<typeof context>>){return {...jurisdictionPack(ctx.jurisdiction),hazards:resolveHazards(ctx.jurisdiction)}}
function sessionView(session:PracticeSession,ctx:Awaited<ReturnType<typeof context>>){
 const content=catalog(ctx);const id=session.itemIds[session.cursor];
 if(!id)return {...session,item:null};
 if(session.kind==='hazard'){const scene=content.hazards.find(h=>h.id===id);return {...session,item:scene?{type:'hazard' as const,...publicHazard(scene)}:null}}
 const q=content.challenges.find(q=>q.id===id);const concept=content.concepts.find(c=>c.id===q?.conceptId);
 return {...session,item:q&&concept?{type:'question' as const,id:q.id,conceptId:q.conceptId,title:concept.name,prompt:q.prompt,options:q.options,version:concept.version}:null};
}
async function recommendation(ctx:Awaited<ReturnType<typeof context>>){
 const content=catalog(ctx);const e=(await learnerEvidence(ctx.householdId,ctx.teenId));const ids=[...content.concepts.map(c=>c.id),...content.hazards.map(h=>h.conceptId)];
 const sessions=(await owned<PracticeSession>('intelligence_session',ctx.householdId,ctx.teenId));
 const practice=(await owned<PracticeAttempt>('permit_attempt',ctx.householdId,ctx.teenId));
 const practiceSignals=practice.map(a=>({...a,challengeId:a.itemId,answerId:'practice',kind:'learning' as const,contentVersion:a.version}));
 const choice=chooseScout({...content,mastery:ids.map(id=>mastery(id,e.learning,e.guardian)),evidence:[...e.learning,...practiceSignals],sessions:sessions.filter(s=>s.jurisdiction===ctx.jurisdiction&&sessionView(s,ctx).item),guardian:ctx.guardian,now:now()});
 const records=(await owned<Recommendation>('scout_plan',ctx.householdId,ctx.teenId)).filter(r=>ctx.guardian?r.type==='guardian_reinforcement':r.type!=='guardian_reinforcement');const old=records.at(-1);
 const oldAvailable=old&&(ids.includes(old.conceptId)||sessions.some(s=>s.id===old.conceptId&&!s.completedAt&&s.jurisdiction===ctx.jurisdiction&&sessionView(s,ctx).item));
 if(oldAvailable&&keepRecommendation(old,choice,now()))return old!;
 if(old&&['recommended','started'].includes(old.status))(await put('scout_plan',{...old,status:old.expiresAt<=now()?'expired':'superseded'}));
 const dismissed=records.filter(r=>r.status==='dismissed'&&r.expiresAt>now()).map(r=>r.conceptId);
 const alternative=dismissed.includes(choice.conceptId)?content.concepts.find(c=>!dismissed.includes(c.id)):undefined;
 const next=alternative?{...choice,type:'practice_concept' as const,conceptId:alternative.id,title:`Practice ${alternative.name}`,reason:'Another topic is available after your optional dismissal.'}:choice;
 const result=(await put<Recommendation>('scout_plan',{...base(ctx.householdId,ctx.teenId),teenId:ctx.teenId,...next,status:'recommended',createdAt:now(),expiresAt:new Date(Date.now()+86400000).toISOString()}));(await event(ctx.householdId,ctx.teenId,'scout_recommendation_created'));return result;
}
async function scoped<T extends {householdId:string;teenId:string}>(kind:string,id:string,ctx:Awaited<ReturnType<typeof context>>){const r=(await get<T>(kind,id));if(!r||r.householdId!==ctx.householdId||r.teenId!==ctx.teenId)deny('Activity unavailable.',404);return r}
export async function readIntelligence(user:User,householdId:string,teenId:string){return (await transaction(async ()=>{try{
 const ctx=(await context(user,householdId,teenId));const content=catalog(ctx);const e=(await learnerEvidence(householdId,teenId));
 const sessions=(await owned<PracticeSession>('intelligence_session',householdId,teenId));
 const attempts=(await owned<PracticeAttempt>('permit_attempt',householdId,teenId));
 const coach=(await all<CoachActivity>('coach_activity',householdId)).filter(a=>a.teenId===teenId&&a.guardianId===user.id);
 (await audit(user.id,householdId,'intelligence.read','ALLOW','Relationship and safety checks passed.'));
 return {status:200,data:{role:ctx.member.role,jurisdiction:ctx.jurisdiction,fallback:content.concepts.length?'':'Jurisdiction-specific content is not yet available. Core hazard awareness remains available.',hazards:content.hazards.map(publicHazard),recommendation:(await recommendation(ctx)),sessions:sessions.filter(s=>!s.completedAt).map(s=>sessionView(s,ctx)),permit:{completed:sessions.filter(s=>s.kind==='permit'&&s.completedAt).length,coverage:new Set(attempts.map(a=>a.conceptId)).size,missed:Array.from(new Set(attempts.filter(a=>!a.correct).map(a=>a.conceptId))),attempts},coach,coachConcepts:[...content.concepts.map(c=>({id:c.id,name:c.name})),...Array.from(new Set(content.hazards.map(h=>h.conceptId))).map(id=>({id,name:'Hazard awareness across road scenes'}))],hazardPassport:Array.from(new Set(content.hazards.map(h=>h.conceptId))).map(id=>({...mastery(id,e.learning,e.guardian),name:'Hazard awareness across road scenes'})),recentEvidence:e.learning.filter(e=>e.conceptId.startsWith('CORE:hazard-')).slice(-5)}};
 }catch(error){if(!(error instanceof AppError))throw error;(await audit(user.id,householdId,'intelligence.read','DENY','Learning authorization rejected.'));return {status:error.status,error:error.message}}}))}
export async function executeIntelligence(user:User,raw:unknown,key:string){return (await transaction(async ()=>{
 const parsed=command.safeParse(raw);if(!parsed.success){(await audit(user.id,'','intelligence.invalid','DENY','Strict command validation rejected.'));return {status:400,error:'Invalid learning action.'}}
 const c=parsed.data;
 try{
 const ctx=(await context(user,c.householdId,c.teenId));const guardianAction=c.action.startsWith('coach_');
 if(guardianAction?!ctx.guardian:ctx.member.role!=='teen'||user.id!==ctx.teenId)deny();
 if(!/^[a-zA-Z0-9_-]{16,100}$/.test(key))deny('Request key required.',400);
 const fingerprint=hash(JSON.stringify(c));const prior=(await db().prepare('SELECT * FROM requests WHERE user_id=? AND key=?').get(user.id,key));
 if(prior){if(prior.fingerprint!==fingerprint)deny('Request key already used.',409);return JSON.parse(String(prior.result)) as {status:number;result:unknown}}
 const content=catalog(ctx);let result:unknown;
 (await audit(user.id,ctx.householdId,`intelligence.${c.action}.proposal`,'ALLOW','GUARD validated identity, relationship, role, consent, context and driving state.'));
 (await db().exec('SAVEPOINT intelligence'));
 try{
 if(c.action==='start'){
  const active=(await owned<PracticeSession>('intelligence_session',ctx.householdId,ctx.teenId)).find(s=>!s.completedAt&&s.kind===c.kind&&s.jurisdiction===ctx.jurisdiction&&sessionView(s,ctx).item);
  if(active&&active.jurisdiction===ctx.jurisdiction&&sessionView(active,ctx).item)result=sessionView(active,ctx);
  else{
   let itemIds:string[]=[];
   if(c.kind==='hazard'){const seen=(await learnerEvidence(ctx.householdId,ctx.teenId)).learning;const candidates=content.hazards.filter(h=>!c.itemId||h.id===c.itemId||h.conceptId===c.itemId).sort((a,b)=>seen.filter(e=>e.challengeId===a.id).length-seen.filter(e=>e.challengeId===b.id).length);const scene=candidates[0];if(!scene)deny('Scene unavailable.',404);itemIds=[scene.id]}
   else{
    if(!content.concepts.length)deny('Jurisdiction-specific content is not yet available.',409);
    const attempts=(await owned<PracticeAttempt>('permit_attempt',ctx.householdId,ctx.teenId));const e=(await learnerEvidence(ctx.householdId,ctx.teenId)).learning;
    const missed=new Set(attempts.filter(a=>!a.correct).map(a=>a.conceptId));
    const eligible=content.challenges.filter(q=>c.kind!=='review'||q.conceptId===c.itemId);
    itemIds=eligible.sort((a,b)=>Number(missed.has(b.conceptId))-Number(missed.has(a.conceptId))||Number([...attempts,...e].some(e=>'itemId'in e?e.itemId===a.id:e.challengeId===a.id))-Number([...attempts,...e].some(e=>'itemId'in e?e.itemId===b.id:e.challengeId===b.id))||a.id.localeCompare(b.id)).slice(0,c.kind==='review'?3:5).map(q=>q.id);
   }
   if(!itemIds.length)deny('Published content unavailable.',409);
   if(c.recommendationId){const r=(await scoped<Recommendation>('scout_plan',c.recommendationId,ctx));if(r.status!=='recommended'||r.expiresAt<=now())deny('Recommendation unavailable.',409);(await put('scout_plan',{...r,status:'started'}));(await event(ctx.householdId,ctx.teenId,'scout_recommendation_started'))}
   const s=(await put<PracticeSession>('intelligence_session',{...base(ctx.householdId,ctx.teenId),teenId:ctx.teenId,kind:c.kind,jurisdiction:ctx.jurisdiction,itemIds,cursor:0,startedAt:now(),recommendationId:c.recommendationId}));(await event(ctx.householdId,ctx.teenId,c.kind==='permit'?'permit_prep_started':c.kind==='hazard'?'hazard_scene_started':'review_started'));result=sessionView(s,ctx);
  }
 }else if(c.action==='answer'){
  const s=(await scoped<PracticeSession>('intelligence_session',c.sessionId,ctx));if(s.completedAt||s.itemIds[s.cursor]!==c.itemId||s.jurisdiction!==ctx.jurisdiction)deny('Current activity unavailable.',409);
  let correct=false,explanation='',conceptId='',version='';
  if(s.kind==='hazard'){const h=content.hazards.find(h=>h.id===c.itemId);if(!h||!h.responseOptions.some(o=>o.id===c.answerId)||!c.targets||new Set(c.targets).size!==c.targets.length||c.targets.some(id=>!h.hazardTargets.some(t=>t.id===id)))deny('Scene response unavailable.',409);correct=assessHazard(h,c.targets,c.answerId);explanation=h.explanation;conceptId=h.conceptId;version=h.version}
  else{const q=content.challenges.find(q=>q.id===c.itemId);const concept=content.concepts.find(x=>x.id===q?.conceptId);if(!q||!concept||!q.options.some(o=>o.id===c.answerId))deny('Published question unavailable.',409);correct=q.answerId===c.answerId;explanation=q.explanation;conceptId=q.conceptId;version=concept.version}
  const evidence=s.kind==='permit'?(await put<PracticeAttempt>('permit_attempt',{...base(ctx.householdId,ctx.teenId),teenId:ctx.teenId,sessionId:s.id,itemId:c.itemId,conceptId,correct,explanation,version,at:now()})):(await recordLearning({householdId:ctx.householdId,teenId:ctx.teenId,conceptId,sessionId:s.id,challengeId:c.itemId,answerId:c.answerId,...(s.kind==='hazard'?{selectedTargets:c.targets}:{}),correct,contentVersion:version}));
  if(s.kind!=='permit')(await projectMastery(ctx.householdId,ctx.teenId,conceptId));
  const completed=s.cursor+1===s.itemIds.length;(await put('intelligence_session',{...s,cursor:s.cursor+1,completedAt:completed?now():undefined}));(await event(ctx.householdId,ctx.teenId,'concept_attempted'));
  if(completed){(await event(ctx.householdId,ctx.teenId,s.kind==='permit'?'permit_prep_completed':s.kind==='hazard'?'hazard_scene_completed':'review_completed'));if(s.recommendationId){const r=(await scoped<Recommendation>('scout_plan',s.recommendationId,ctx));(await put('scout_plan',{...r,status:'completed'}));(await event(ctx.householdId,ctx.teenId,'scout_recommendation_completed'))}}
  result={correct,explanation,completed,evidenceId:evidence.id,kind:s.kind};
 }else if(c.action==='coach_start'){
  const concept=content.concepts.find(x=>x.id===c.conceptId);const hazard=content.hazards.find(x=>x.conceptId===c.conceptId);if(!concept&&!hazard)deny('Published concept unavailable.',404);
  const existing=(await all<CoachActivity>('coach_activity',ctx.householdId)).find(a=>a.teenId===ctx.teenId&&a.guardianId===user.id&&a.conceptId===c.conceptId&&a.status==='started');
  result=existing||(await put<CoachActivity>('coach_activity',{...base(ctx.householdId,user.id),teenId:ctx.teenId,guardianId:user.id,conceptId:c.conceptId,title:`Discuss ${concept?.name||hazard?.title}: ask what matters and why, while away from driving.`,context:c.context,status:'started',startedAt:now()}));(await event(ctx.householdId,ctx.teenId,'guardian_activity_started'));
 }else if(c.action==='coach_complete'){
  const a=(await scoped<CoachActivity>('coach_activity',c.activityId,ctx));if(a.guardianId!==user.id||a.status!=='started')deny('Guardian activity unavailable.',409);
  if(!content.concepts.some(x=>x.id===a.conceptId)&&!content.hazards.some(h=>h.conceptId===a.conceptId))deny('Published concept unavailable.',409);
  const e=(await learnerEvidence(ctx.householdId,ctx.teenId));const latest=e.guardian.filter(g=>g.conceptId===a.conceptId).at(-1);if(latest&&Date.now()-Date.parse(latest.at)<observationGapMs)deny('This practice was already recorded today.',409);
  (await put<GuardianReinforcement>('roadready_guardian',{...base(ctx.householdId,user.id),teenId:ctx.teenId,conceptId:a.conceptId,guardianId:user.id,completed:c.completed,context:a.context,kind:'guardian',at:now()}));
  result={activity:(await put('coach_activity',{...a,status:c.completed?'completed':'needs_more_practice',completedAt:now()})),mastery:(await projectMastery(ctx.householdId,ctx.teenId,a.conceptId))};(await event(ctx.householdId,ctx.teenId,'guardian_activity_completed'));
  for(const r of (await owned<Recommendation>('scout_plan',ctx.householdId,ctx.teenId)).filter(r=>r.type==='guardian_reinforcement'&&r.conceptId===a.conceptId&&r.status==='recommended'))(await put('scout_plan',{...r,status:'completed'}));
 }else{const r=(await scoped<Recommendation>('scout_plan',c.recommendationId,ctx));if(r.status!=='recommended'||r.priority<2)deny('This recommendation cannot be dismissed.',409);result=(await put('scout_plan',{...r,status:'dismissed'}))}
 (await db().exec('RELEASE intelligence'));
 }catch(error){(await db().exec('ROLLBACK TO intelligence; RELEASE intelligence'));throw error}
 (await audit(user.id,ctx.householdId,`intelligence.${c.action}`,'ALLOW','Scoped educational activity persisted with provenance.'));
 const response={status:200,result};(await db().prepare('INSERT INTO requests VALUES(?,?,?,?)').run(user.id,key,fingerprint,JSON.stringify(response)));return response;
 }catch(error){if(!(error instanceof AppError))throw error;(await audit(user.id,c.householdId,`intelligence.${c.action}`,'DENY','Authorization or activity validation rejected.'));return {status:error.status,error:error.message}}
}))}
