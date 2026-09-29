import {requirePilotAccess} from '../pilot/access';
import {withGovernedContent} from './review-service';
const transaction=<T>(fn:()=>T|Promise<T>)=>domainTransaction(()=>withGovernedContent(fn));
import {randomUUID} from 'node:crypto';
import {migrateRoadReady} from '../platform/migrations/002-roadready';
import {z} from 'zod';
import {all,db,get,put,transaction as domainTransaction} from '../platform/db';
import {AppError,hash} from '../platform/auth';
import {audit} from '../platform/service';
import {authorizeLearner} from '../platform/authorization';
import {ageOn,journey} from '../platform/journey';
import {texasRule} from '../platform/texas';
import type {Drive,Evidence,SafetyDecision,User} from '../platform/types';
import {concepts,jurisdictionPack,modeFor} from './content';
import {learningPolicy,mastery,observationGapMs} from './rules';
import {modes,type GuardianReinforcement,type LearningEvidence,type LearningSession,type ScoutRecommendation} from './types';
const scopeFields={householdId:z.string().uuid(),teenId:z.string().uuid()};
export const roadreadyCommand=z.discriminatedUnion('action',[
 z.object({...scopeFields,action:z.literal('start'),mode:z.enum(modes),conceptId:z.string().max(100).optional(),context:z.enum(['PARKED','SUPERVISED_PRE_DRIVE'])}).strict(),
 z.object({...scopeFields,action:z.literal('answer'),sessionId:z.string().uuid(),challengeId:z.string().max(100),answerId:z.string().max(100),context:z.enum(['PARKED','SUPERVISED_PRE_DRIVE'])}).strict(),
 z.object({...scopeFields,action:z.literal('reinforce'),conceptId:z.string().max(100),completed:z.boolean(),context:z.enum(['PARKED','SUPERVISED_PRE_DRIVE'])}).strict(),
 z.object({...scopeFields,action:z.literal('accept_recommendation'),recommendationId:z.string().uuid(),context:z.enum(['PARKED','SUPERVISED_PRE_DRIVE'])}).strict(),
]);

const now=()=>new Date().toISOString();
const base=(householdId:string,ownerId:string)=>({id:randomUUID(),householdId,ownerId});
function fail(message:string,status=403):never{throw new AppError(message,status)}
class GuardFailure extends AppError {constructor(message:string,public decision:SafetyDecision){super(message,403)}}
export const roadreadyEnabled=()=>process.env.SCOUT_LEARNING_ENABLED==='true'||process.env.ROADREADY_LEARNING_ENABLED==='true';
async function ensureEvidenceProtection(){
 (await migrateRoadReady(db()));
}
async function authorize(user:User,householdId:string,teenId:string,action:string){
 if(!roadreadyEnabled())fail('Scout Learning is not enabled for this pilot.',404);
 const {member,profile:p,guardian}=(await authorizeLearner(user,householdId,teenId));
 await requirePilotAccess(householdId);
 if(ageOn(p.birthDate)<18&&!p.consent)throw new GuardFailure('Guardian consent is required.','REQUIRE_CONSENT');
 if(ageOn(p.birthDate)>=18&&user.id!==teenId&&!p.adultSharing)fail('The adult learner must renew family sharing consent.');
 const driving=(await all<Drive>('drive')).some(d=>d.status==='active'&&(d.teenId===teenId||d.teenId===user.id||d.supervisorId===user.id));
 const policy=learningPolicy(action,driving);if(policy.decision!=='ALLOW')throw new GuardFailure(policy.reason,policy.decision);
 if(action==='reinforce'&&!guardian)fail('Only a linked guardian may confirm parked practice.');
 if(['start','answer','accept_recommendation'].includes(action)&&user.id!==teenId)fail('The learner must submit their own learning responses.');
 const jurisdiction=p.jurisdiction==='TX'?'US-TX':p.jurisdiction;
 if(!jurisdictionPack(jurisdiction).concepts.length)fail('An official-source learning pack is not available for this jurisdiction.',409);
 return {profile:p,jurisdiction,role:member.role};
}
async function evidence(householdId:string,teenId:string){return {learning:(await all<LearningEvidence>('roadready_attempt',householdId)).filter(e=>e.teenId===teenId),guardian:(await all<GuardianReinforcement>('roadready_guardian',householdId)).filter(e=>e.teenId===teenId)}}
async function summary(householdId:string,teenId:string,jurisdiction:string){const e=(await evidence(householdId,teenId));return {e,...jurisdictionPack(jurisdiction),mastery:jurisdictionPack(jurisdiction).concepts.map(c=>mastery(c.id,e.learning,e.guardian))}}
async function event(householdId:string,teenId:string,name:string,conceptId?:string){(await put('roadready_event',{...base(householdId,teenId),name,conceptId,at:now()}))}
async function recommend(householdId:string,teenId:string,jurisdiction:string){
 const s=(await summary(householdId,teenId,jurisdiction));
 const weak=s.mastery.find(m=>m.state==='practicing'&&(!m.retryAt||m.retryAt<=now()));
 const target=weak||s.mastery.find(m=>m.state==='not_started')||s.mastery.find(m=>m.state==='introduced')||s.mastery[0];
 const previous=(await all<ScoutRecommendation>('roadready_recommendation',householdId)).filter(r=>r.teenId===teenId).at(-1);
 if(previous&&!previous.acceptedAt&&previous.conceptId===target.conceptId)return previous;
 return (await put<ScoutRecommendation>('roadready_recommendation',{...base(householdId,teenId),teenId,agent:'SCOUT',conceptId:target.conceptId,mode:modeFor(s.concepts.find(c=>c.id===target.conceptId)!.category),reason:weak?'Revisit a concept that needs another look.':'Build understanding with a new or later learning observation.',at:now()}));
}
async function selectChallenges(householdId:string,teenId:string,jurisdiction:string,mode:LearningSession['mode'],focus?:string){
 const s=(await summary(householdId,teenId,jurisdiction));
 const eligible=s.concepts.filter(c=>modeFor(c.category)===mode&&(!focus||c.id===focus));
 const rank=(id:string)=>{const m=s.mastery.find(m=>m.conceptId===id)!;return m.state==='practicing'&&(!m.retryAt||m.retryAt<=now())?0:m.state==='not_started'?1:m.state==='introduced'?2:m.state==='practicing'?3:4};
 const ordered=eligible.sort((a,b)=>rank(a.id)-rank(b.id)||a.id.localeCompare(b.id));
 return ordered.slice(0,5).map(c=>{const attempts=s.e.learning.filter(e=>e.conceptId===c.id);const last=attempts.at(-1);const variants=s.challenges.filter(q=>q.conceptId===c.id);return variants.find(q=>!attempts.some(e=>e.challengeId===q.id))?.id||variants[(variants.findIndex(q=>q.id===last?.challengeId)+1)%variants.length].id});
}
function publicSession(s:LearningSession){const q=jurisdictionPack(s.jurisdiction).challenges.find(q=>q.id===s.challengeIds[s.cursor]);return {...s,challenge:q?{id:q.id,conceptId:q.conceptId,prompt:q.prompt,options:q.options}:null}}
export async function readRoadReady(user:User,householdId:string,teenId:string){
 return (await transaction(async ()=>{try{
   const auth=(await authorize(user,householdId,teenId,'read'));(await ensureEvidenceProtection());
   const s=(await summary(householdId,teenId,auth.jurisdiction));const recommendation=(await recommend(householdId,teenId,auth.jurisdiction));
   const session=(await all<LearningSession>('roadready_session',householdId)).find(s=>s.teenId===teenId&&!s.completedAt);
   const drives=(await all<Drive>('drive',householdId));const verified=drives.filter(d=>d.teenId===teenId&&d.status==='verified');
   const next=journey(auth.profile,drives,(await all<Evidence>('evidence',householdId)),[texasRule],{verifiedMinutes:verified.reduce((n,d)=>n+d.minutes,0),nightMinutes:verified.reduce((n,d)=>n+d.nightMinutes,0)}).next;
   (await audit(user.id,householdId,'roadready.read','ALLOW','Scoped learning result passed GUARD.'));
   return {status:200,data:{role:auth.role,concepts:s.concepts,mastery:s.mastery,evidence:s.e.learning,guardianEvidence:s.e.guardian,session:session?publicSession(session):null,recommendation,priorityStep:next,passport:s.mastery.map(m=>({...m,provenance:`${m.qualifyingObservations} qualifying learning observations; ${s.e.guardian.filter(e=>e.conceptId===m.conceptId&&e.completed).length} guardian parked-practice confirmations.`,claim:'Educational evidence only; not licensing or insurance certification.'}))}};
  }catch(error){if(!(error instanceof AppError))throw error;(await audit(user.id,householdId,'roadready.read',error instanceof GuardFailure?error.decision:'DENY',error.message));return {status:error.status,error:error.message}}}));
}
export async function executeRoadReady(user:User,raw:unknown,key:string){return (await transaction(async ()=>{
 const parsed=roadreadyCommand.safeParse(raw);if(!parsed.success){(await audit(user.id,'','roadready.invalid','DENY','Command schema rejected unsupported or invalid action.'));return {status:400,error:'Unsupported or invalid learning action.'}}
 const c=parsed.data;
 try{
  const auth=(await authorize(user,c.householdId,c.teenId,c.action));(await ensureEvidenceProtection());
  if(!/^[a-zA-Z0-9_-]{16,100}$/.test(key))fail('A valid request key is required.',400);
  const fingerprint=hash(JSON.stringify(c));const old=(await db().prepare('SELECT * FROM requests WHERE user_id=? AND key=?').get(user.id,key));
  if(old){if(old.fingerprint!==fingerprint)fail('Request key already used.',409);return JSON.parse(String(old.result)) as {status:number;result:unknown}}
  (await audit(user.id,c.householdId,`roadready.${c.action}.proposal`,'ALLOW','GUARD validated actor, consent, household, jurisdiction and driving state.'));
  (await db().exec('SAVEPOINT roadready'));
  let result:unknown;
  try{
   if(c.action==='start'){
    const active=(await all<LearningSession>('roadready_session',c.householdId)).find(s=>s.teenId===c.teenId&&!s.completedAt);
    if(active)result=publicSession(active);
    else{const ids=(await selectChallenges(c.householdId,c.teenId,auth.jurisdiction,c.mode,c.conceptId));if(!ids.length)fail('No matching learning challenges.',400);
     const s=(await put<LearningSession>('roadready_session',{...base(c.householdId,c.teenId),teenId:c.teenId,mode:c.mode,jurisdiction:auth.jurisdiction,challengeIds:ids,cursor:0,startedAt:now()}));result=publicSession(s);(await event(c.householdId,c.teenId,'learning_session_started'));(await event(c.householdId,c.teenId,'roadready_started'));}
   }else if(c.action==='answer'){
    const s=(await get<LearningSession>('roadready_session',c.sessionId));if(!s||s.householdId!==c.householdId||s.teenId!==c.teenId||s.completedAt)fail('Learning session not available.',409);
    const q=jurisdictionPack(auth.jurisdiction).challenges.find(q=>q.id===s!.challengeIds[s!.cursor]);if(!q||q.id!==c.challengeId||!q.options.some(o=>o.id===c.answerId))fail('Answer does not match the current challenge.',409);
    const concept=concepts.find(x=>x.id===q!.conceptId)!;const before=(await evidence(c.householdId,c.teenId));const prior=mastery(concept.id,before.learning,before.guardian);
    const e=(await put<LearningEvidence>('roadready_attempt',{...base(c.householdId,c.teenId),teenId:c.teenId,conceptId:concept.id,sessionId:s!.id,challengeId:q!.id,answerId:c.answerId,correct:q!.answerId===c.answerId,at:now(),kind:'learning',contentVersion:concept.contentVersion}));
    const completed=s!.cursor+1===s!.challengeIds.length;(await put('roadready_session',{...s!,cursor:s!.cursor+1,completedAt:completed?now():undefined}));
    const m=mastery(concept.id,[...before.learning,e],before.guardian);(await put('roadready_mastery',{id:`roadready:${c.householdId}:${c.teenId}:${concept.id}`,householdId:c.householdId,ownerId:c.teenId,teenId:c.teenId,...m,passportSection:'Road Knowledge & Awareness'}));
    (await event(c.householdId,c.teenId,'concept_attempted',concept.id));if(prior.state!=='not_started')(await event(c.householdId,c.teenId,'concept_revisited',concept.id));if(m.state!==prior.state&&['demonstrated','reinforced'].includes(m.state))(await event(c.householdId,c.teenId,`concept_${m.state}`,concept.id));if(completed)(await event(c.householdId,c.teenId,'learning_session_completed'));
    result={correct:e.correct,explanation:q!.explanation,answerId:q!.answerId,evidenceId:e.id,mastery:m,completed};
   }else if(c.action==='reinforce'){
    if(!jurisdictionPack(auth.jurisdiction).concepts.some(x=>x.id===c.conceptId))fail('Unknown concept.',400);
    const e=(await evidence(c.householdId,c.teenId));const latest=e.guardian.filter(x=>x.conceptId===c.conceptId).at(-1);if(latest&&Date.now()-Date.parse(latest.at)<observationGapMs)fail('This practice was already recorded today.',409);
    (await event(c.householdId,c.teenId,'guardian_reinforcement_started',c.conceptId));
    const confirmation=(await put<GuardianReinforcement>('roadready_guardian',{...base(c.householdId,user.id),teenId:c.teenId,conceptId:c.conceptId,completed:c.completed,context:c.context,guardianId:user.id,kind:'guardian',at:now()}));
    const m=mastery(c.conceptId,e.learning,[...e.guardian,confirmation]);(await put('roadready_mastery',{id:`roadready:${c.householdId}:${c.teenId}:${c.conceptId}`,householdId:c.householdId,ownerId:c.teenId,teenId:c.teenId,...m,passportSection:'Road Knowledge & Awareness'}));
    (await event(c.householdId,c.teenId,'guardian_reinforcement_completed',c.conceptId));if(m.state==='reinforced')(await event(c.householdId,c.teenId,'concept_reinforced',c.conceptId));result={confirmation,mastery:m};
   }else{
    const r=(await get<ScoutRecommendation>('roadready_recommendation',c.recommendationId));if(!r||r.householdId!==c.householdId||r.teenId!==c.teenId)fail('Recommendation unavailable.',404);
    result=(await put('roadready_recommendation',{...r!,acceptedAt:now()}));(await event(c.householdId,c.teenId,'scout_recommendation_accepted',r!.conceptId));
   }
   (await put('assignment',{...base(c.householdId,user.id),agent:'SCOUT',action:c.action,state:'COMPLETED',transitions:['ASSIGNED','ASSESSING','READY','IN_PROGRESS','AWAITING_VERIFICATION','VERIFIED','COMPLETED'],at:now(),rationale:'Authenticated educational action validated by deterministic rules.'}));
   (await db().exec('RELEASE roadready'));
  }catch(error){(await db().exec('ROLLBACK TO roadready; RELEASE roadready'));throw error}
  (await audit(user.id,c.householdId,`roadready.${c.action}`,'ALLOW','GUARD authorized scoped action and sourced educational result.'));
  const response={status:200,result};(await db().prepare('INSERT INTO requests VALUES(?,?,?,?)').run(user.id,key,fingerprint,JSON.stringify(response)));return response;
 }catch(error){if(!(error instanceof AppError))throw error;(await audit(user.id,c.householdId,`roadready.${c.action}`,error instanceof GuardFailure?error.decision:'DENY',error.message));return {status:error.status,error:error.message}}
}))}
