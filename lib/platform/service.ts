import {requirePilotAccess} from '../pilot/access';
import {randomBytes,randomUUID} from 'node:crypto';
import {all,db,get,put,transaction} from './db';
import {AppError,hash} from './auth';
import type {Command} from './commands';
import type {Dashboard,Drive,Evidence,Household,Invite,Member,Profile,Relationship,Reminder,SafetyDecision,User} from './types';
import {ageOn,journey} from './journey';
import {jurisdictionRules,ruleForJurisdiction} from './jurisdictions';
import {agentContracts} from './agents';

const now=()=>new Date().toISOString();
const base=(householdId:string,ownerId:string)=>({id:randomUUID(),householdId,ownerId});
function fail(message:string,status=403):never{throw new AppError(message,status)}
export async function audit(actorId:string,householdId:string,action:string,decision:SafetyDecision,reason:string){(await db().prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?)').run(randomUUID(),now(),actorId,householdId,action,decision,reason))}
async function membership(userId:string,householdId:string){return (await all<Member>('member',householdId)).find(m=>m.ownerId===userId&&m.active)}
async function profile(householdId:string,teenId:string){return (await all<Profile>('profile',householdId)).find(p=>p.ownerId===teenId)}
async function connected(userId:string,teenId:string,householdId:string,kind?:Relationship['kind']){return (await all<Relationship>('relationship',householdId)).some(r=>r.active&&r.adultId===userId&&r.teenId===teenId&&(!kind||r.kind===kind))}
async function scope(user:User,householdId:string,teenId:string,guardian=false){const m=(await membership(user.id,householdId));if(!m)fail('Household access denied.');const p=(await profile(householdId,teenId));if(!p)fail('Complete the driver profile first.',409);if(guardian){if(m.role!=='guardian'||!(await connected(user.id,teenId,householdId,'guardian')))fail('A linked guardian must approve this action.')}else if(user.id!==teenId&&!(await connected(user.id,teenId,householdId)))fail('Driver access denied.');if(ageOn(p.birthDate)>=18&&user.id!==teenId&&!p.adultSharing)fail('The adult driver must renew family sharing consent.');return p}
function processingAllowed(p:Profile){return ageOn(p.birthDate)>=18||p.consent}
async function driveResource(user:User,householdId:string,id:string){const d=(await get<Drive>('drive',id));if(!d||d.householdId!==householdId)fail('Drive not found.',404);(await scope(user,householdId,d.teenId));return d}
async function activeFor(userId:string){return (await all<Drive>('drive')).find(d=>d.status==='active'&&(d.teenId===userId||d.supervisorId===userId))}
async function ledger(d:Drive,actorId:string,reason:string,minutes:number,nightMinutes:number){(await db().prepare('INSERT INTO ledger VALUES(?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),d.id,d.revision,d.householdId,d.teenId,minutes,nightMinutes,actorId,reason,now()))}
async function totals(householdId:string,teenId:string,drives:Drive[]){const verified=drives.filter(d=>d.teenId===teenId&&d.status==='verified');return {verifiedMinutes:verified.reduce((n,d)=>n+d.minutes,0),nightMinutes:verified.reduce((n,d)=>n+d.nightMinutes,0),weatherMinutes:verified.reduce((n,d)=>n+(d.weatherMinutes||0),0),loggedMinutes:drives.filter(d=>d.teenId===teenId&&['pending','verified'].includes(d.status)).reduce((sum,d)=>sum+d.minutes,0),pending:drives.filter(d=>d.teenId===teenId&&d.status==='pending').length}}
function assertDuration(minutes:number,nightMinutes:number,weatherMinutes=0){if(nightMinutes>minutes)fail('Night minutes cannot exceed total minutes.',400);if(weatherMinutes>minutes)fail('Poor-weather minutes cannot exceed total minutes.',400)}
async function assertNoOverlap(teenId:string,start:string,end:string,exceptId?:string){if((await all<Drive>('drive')).some(d=>d.id!==exceptId&&d.teenId===teenId&&d.status!=='cancelled'&&d.startedAt<end&&(d.endedAt||now())>start))fail('This session overlaps another recorded drive.',409)}

async function policy(user:User,c:Command):Promise<{decision:SafetyDecision;reason:string}>{
 if((await activeFor(user.id))&&!['drive.end','drive.cancel'].includes(c.action))return {decision:'DEFER',reason:'Your drive comes first. Resume after parking.'};
 if('householdId'in c&&!(await membership(user.id,c.householdId)))return {decision:'DENY',reason:'Household access denied.'};
 if('householdId'in c&&'teenId'in c&&c.teenId){const p=(await profile(c.householdId,c.teenId));if(p&&!processingAllowed(p)&&!['profile.save','consent.set','invite.create','sharing.set'].includes(c.action))return {decision:'REQUIRE_CONSENT',reason:'A guardian must grant practice and journey consent first.'}}
 return {decision:'ALLOW',reason:'Authenticated action passes initial safety checks.'};
}

export async function execute(user:User,c:Command,key:string){return (await transaction(async ()=>{
 const fingerprint=hash(JSON.stringify(c));const existing=(await db().prepare('SELECT * FROM requests WHERE user_id=? AND key=?').get(user.id,key));
 if(existing){if(existing.fingerprint!==fingerprint)return {status:409,error:'This request key was already used for another action.'};return JSON.parse(String(existing.result)) as {status:number;error?:string;result?:unknown}}
 const householdId='householdId'in c?c.householdId:'';const decision=(await policy(user,c));
 if(decision.decision!=='ALLOW'){(await audit(user.id,householdId,c.action,decision.decision,decision.reason));return {status:403,error:decision.reason,policy:decision}}
 (await db().exec('SAVEPOINT command'));
 try{const result=(await apply(user,c));const routedAgent=c.action.startsWith('drive.')?(c.action==='drive.start'?'CRUZE':'MILES'):c.action.startsWith('evidence.')?'VIBE':c.action==='agent.explain'?'VIBE':'GUARD';const contract=agentContracts.find(a=>a.agent_id===routedAgent)!;(await put('assignment',{...base(householdId,user.id),agent:contract.agent_id,action:c.action,state:c.action==='drive.submit'||c.action==='evidence.add'?'AWAITING_VERIFICATION':'COMPLETED',transitions:['ASSIGNED','ASSESSING','READY','IN_PROGRESS',...(c.action==='drive.submit'||c.action==='evidence.add'?['AWAITING_VERIFICATION']:['AWAITING_VERIFICATION','VERIFIED','COMPLETED'])],at:now(),rationale:'Deterministic service outcome; awaiting human evidence review where required.'}));(await db().exec('RELEASE command'));(await audit(user.id,householdId,c.action,'ALLOW','Domain permissions and requirements passed.'));const response={status:200,result};(await db().prepare('INSERT INTO requests VALUES(?,?,?,?)').run(user.id,key,fingerprint,JSON.stringify(response)));return response}
 catch(error){(await db().exec('ROLLBACK TO command; RELEASE command'));if(!(error instanceof AppError))throw error;(await audit(user.id,householdId,c.action,'DENY',error.message));return {status:error.status,error:error.message}}
}))}

async function apply(user:User,c:Command):Promise<unknown>{
 if(c.action==='household.create'){
  if((await all<Member>('member')).some(m=>m.ownerId===user.id&&m.role==='teen'))fail('Teen accounts cannot create guardian households.');
  const household={...base('',user.id),name:c.name,createdAt:now()};household.householdId=household.id;(await put('household',household));(await put<Member>('member',{...base(household.id,user.id),role:'guardian',name:user.name,active:true}));return household;
 }
 if(c.action==='invite.accept'){
  const invite=(await all<Invite>('invite')).find(i=>i.hash===hash(c.token));if(!invite||invite.acceptedBy||invite.expiresAt<now())fail('This invitation is invalid, used, or expired.',400);
  if(invite.ownerId===user.id)fail('Use a different account to accept this invitation.');
  if(invite.role!=='teen'&&!c.adultAttestation)fail('An adult must accept the guardian or supervisor invitation.');
  const otherRoles=(await all<Member>('member')).filter(m=>m.ownerId===user.id);if(otherRoles.some(m=>(m.role==='teen')!==(invite.role==='teen')))fail('This account has an incompatible household role.');
  if(invite.role==='teen'&&otherRoles.some(m=>m.active&&m.householdId!==invite.householdId))fail('An existing learner cannot join another household by invitation.');
  let member=(await membership(user.id,invite.householdId));if(member&&member.role!==invite.role)fail('This household role cannot be changed by invitation.');
  if(!member)member=(await put<Member>('member',{...base(invite.householdId,user.id),name:user.name,role:invite.role,active:true}));
  if(invite.role==='teen')(await put<Relationship>('relationship',{...base(invite.householdId,invite.ownerId),adultId:invite.ownerId,teenId:user.id,kind:'guardian',active:true,createdAt:now()}));
  else (await put<Relationship>('relationship',{...base(invite.householdId,user.id),adultId:user.id,teenId:invite.teenId,kind:invite.role,active:true,createdAt:now()}));
  (await put('invite',{...invite,acceptedBy:user.id}));return {householdId:invite.householdId};
 }
 if(c.action==='invite.create'){
  if((await membership(user.id,c.householdId))?.role!=='guardian')fail('Only a guardian can invite family members.');
  if(c.role!=='teen'){if(!c.teenId)fail('Select a driver for this invitation.',400);(await scope(user,c.householdId,c.teenId,true))}
  const token=randomBytes(32).toString('base64url');(await put<Invite>('invite',{...base(c.householdId,user.id),hash:hash(token),role:c.role,teenId:c.teenId||'',expiresAt:new Date(Date.now()+48*3600000).toISOString()}));return {token,expiresInHours:48};
 }
 if(c.action==='profile.save'){
  const member=(await membership(user.id,c.householdId))!;const teen=(await membership(c.teenId,c.householdId));if(teen?.role!=='teen')fail('Select a teen member.',400);
  const existing=(await profile(c.householdId,c.teenId));if(existing)(await scope(user,c.householdId,c.teenId));else if(user.id!==c.teenId&&!(await connected(user.id,c.teenId,c.householdId,'guardian')))fail('Only this driver or their guardian can create the profile.');
  if(member.role==='supervisor')fail('Supervisors cannot edit profiles.');
  if((await activeFor(c.teenId)))fail('Profile changes are deferred until the drive is finished.');
  const age=ageOn(c.birthDate);if(age<13||age>25)fail('This local MVP supports drivers ages 13–25.',400);
  if(existing&&existing.birthDate!==c.birthDate)fail('Birth date changes require an operator review.');
  if(existing&&member.role==='teen'&&existing.goalMinutes!==c.goalMinutes&&age<18)fail('A guardian sets the family goal.');
  if(c.permitDate&&c.permitDate<c.birthDate)fail('Permit date must follow birth date.',400);
  return (await put<Profile>('profile',{...(existing||base(c.householdId,c.teenId)),name:c.name,birthDate:c.birthDate,jurisdiction:c.jurisdiction,stage:c.stage,goalMinutes:c.goalMinutes,permitDate:c.permitDate,suspensionDays:c.suspensionDays,consent:existing?.consent||false,consentVersion:'practice-journey-v1',adultSharing:existing?.adultSharing||false}));
 }
 if(c.action==='consent.set'){const p=(await scope(user,c.householdId,c.teenId,true));return (await put('profile',{...p,consent:c.granted,consentedAt:now()}))}
 if(c.action==='sharing.set'){if(user.id!==c.teenId)fail('Only the adult driver can manage sharing.');const p=(await scope(user,c.householdId,c.teenId));if(ageOn(p.birthDate)<18)fail('Adult sharing applies from age 18.');return (await put('profile',{...p,adultSharing:c.granted}))}
 if(c.action==='relationship.revoke'){const relation=(await get<Relationship>('relationship',c.id));if(!relation||relation.householdId!==c.householdId)fail('Relationship not found.',404);(await scope(user,c.householdId,relation.teenId,true));return (await put('relationship',{...relation,active:false}))}
 if(c.action==='drive.start'||c.action==='drive.manual'){
  await requirePilotAccess(c.householdId);
  const p=(await scope(user,c.householdId,c.teenId));if(user.id!==c.teenId)fail('The driver must create their own session.');if(!processingAllowed(p))fail('Guardian consent is required.');
  if(p.stage==='pre-permit'||!p.permitDate)fail('Record your valid permit or license information before logging practice.');
  const jurisdictionRule=ruleForJurisdiction(p.jurisdiction);if(jurisdictionRule?.learnerMinimumAge&&ageOn(p.birthDate)<jurisdictionRule.learnerMinimumAge)fail(`This ${jurisdictionRule.authorityLabel||jurisdictionRule.jurisdiction} learner pathway requires age ${jurisdictionRule.learnerMinimumAge} or older.`);
  if(!(await connected(c.supervisorId,c.teenId,c.householdId))||!(await membership(c.supervisorId,c.householdId))||c.supervisorId===c.teenId)fail('Choose a linked adult supervisor.');
  if((await activeFor(user.id))||(await activeFor(c.supervisorId)))fail('A driver or supervisor already has an active session.',409);
  const startedAt=c.action==='drive.manual'?c.startedAt:now();const endedAt=c.action==='drive.manual'?new Date(Date.parse(startedAt)+c.minutes*60000).toISOString():undefined;
  if(startedAt.slice(0,10)<p.permitDate)fail('Practice cannot precede the recorded permit date.',400);
  if(endedAt){if(endedAt>now())fail('A completed drive cannot end in the future.',400);assertDuration(c.action==='drive.manual'?c.minutes:0,c.action==='drive.manual'?c.nightMinutes:0,c.action==='drive.manual'?c.weatherMinutes:0);(await assertNoOverlap(c.teenId,startedAt,endedAt))}
  return (await put<Drive>('drive',{...base(c.householdId,user.id),teenId:c.teenId,supervisorId:c.supervisorId,skill:c.skill,status:c.action==='drive.start'?'active':'pending',startedAt,endedAt,minutes:c.action==='drive.manual'?c.minutes:0,nightMinutes:c.action==='drive.manual'?c.nightMinutes:0,weatherMinutes:c.action==='drive.manual'?c.weatherMinutes:0,note:c.action==='drive.manual'?c.note:'',revision:0,corrections:[]}));
 }
 if(c.action.startsWith('drive.')){
  if(!('id'in c))fail('Missing drive ID.',400);const d=(await driveResource(user,c.householdId,c.id));const p=(await scope(user,c.householdId,d.teenId));
  if(c.action==='drive.end'||c.action==='drive.cancel'){if(d.teenId!==user.id||d.status!=='active')fail('Only the driver can finish their active session.');const endedAt=now();return (await put('drive',{...d,status:c.action==='drive.cancel'?'cancelled':'draft',endedAt,minutes:Math.max(1,Math.min(240,Math.floor((Date.parse(endedAt)-Date.parse(d.startedAt))/60000)))}))}
  if(!processingAllowed(p))fail('Guardian consent is required.');
  if(c.action==='drive.submit'){if(d.teenId!==user.id||d.status!=='draft')fail('Only a draft can be submitted by its driver.');assertDuration(c.minutes,c.nightMinutes,c.weatherMinutes);(await assertNoOverlap(d.teenId,d.startedAt,d.endedAt!,d.id));return (await put('drive',{...d,status:'pending',minutes:c.minutes,nightMinutes:c.nightMinutes,weatherMinutes:c.weatherMinutes,note:c.note}))}
  if(c.action==='drive.review'){if(user.id!==d.supervisorId)fail('Only the assigned supervisor can attest this session.');if(d.status!=='pending')fail('Only pending sessions can be reviewed.',409);if(c.decision==='dispute'&&!c.reason.trim())fail('Give a reason for the dispute.',400);const reviewed={...d,status:c.decision==='confirm'?'verified' as const:'disputed' as const,reviewedBy:user.id,reviewedAt:now(),reviewReason:c.reason,revision:d.revision+1};if(c.decision==='confirm')(await ledger(reviewed,user.id,'Supervisor attestation',d.minutes,d.nightMinutes));return (await put('drive',reviewed))}
  if(c.action==='drive.correct'){if(user.id!==d.teenId)fail('The driver proposes corrections.');if(!['verified','pending','disputed'].includes(d.status))fail('This session cannot be corrected.');assertDuration(c.minutes,c.nightMinutes,c.weatherMinutes);const corrected={...d,status:'pending' as const,minutes:c.minutes,nightMinutes:c.nightMinutes,weatherMinutes:c.weatherMinutes,revision:d.revision+1,reviewedBy:undefined,reviewedAt:undefined,corrections:[...d.corrections,{minutes:d.minutes,nightMinutes:d.nightMinutes,weatherMinutes:d.weatherMinutes||0,reason:c.reason,actorId:user.id,at:now()}]};if(d.status==='verified')(await ledger(corrected,user.id,c.reason,-d.minutes,-d.nightMinutes));return (await put('drive',corrected))}
 }
 if(c.action==='evidence.add'){const p=(await scope(user,c.householdId,c.teenId));if(!processingAllowed(p))fail('Guardian consent is required.');if((await membership(user.id,c.householdId))?.role==='supervisor')fail('Supervisors cannot access milestone evidence.');if(c.milestone==='coverage'&&(await membership(user.id,c.householdId))?.role!=='guardian')fail('Insurance preparation belongs to a guardian.');return (await put<Evidence>('evidence',{...base(c.householdId,user.id),teenId:c.teenId,milestone:c.milestone,description:c.description,sourceUrl:c.sourceUrl,provenance:'SELF_REPORTED',status:'pending',createdAt:now()}))}
 if(c.action==='evidence.review'){const e=(await get<Evidence>('evidence',c.id));if(!e||e.householdId!==c.householdId)fail('Evidence not found.',404);const p=(await scope(user,c.householdId,e.teenId,true));if(!processingAllowed(p))fail('Consent is required.');if(e.status!=='pending')fail('This evidence was already reviewed.',409);return (await put('evidence',{...e,status:c.accepted?'accepted':'rejected',reviewedBy:user.id,reviewedAt:now()}))}
 if(c.action==='reminder.create'){(await scope(user,c.householdId,c.teenId));if((await membership(user.id,c.householdId))?.role==='supervisor')fail('Supervisors cannot manage reminders.');if(c.dueAt<now())fail('Choose a future reminder time.',400);return (await put<Reminder>('reminder',{...base(c.householdId,user.id),teenId:c.teenId,title:c.title,dueAt:c.dueAt,done:false,enabled:true}))}
 if(c.action==='reminder.update'){const r=(await get<Reminder>('reminder',c.id));if(!r||r.householdId!==c.householdId||r.ownerId!==user.id)fail('Only the reminder creator may change it.');(await scope(user,c.householdId,r.teenId));return (await put('reminder',{...r,done:c.done,enabled:c.enabled}))}
 if(c.action==='agent.explain'){const p=(await scope(user,c.householdId,c.teenId));if((await membership(user.id,c.householdId))?.role==='supervisor')fail('Supervisors only review their assigned sessions.');const drives=(await all<Drive>('drive',c.householdId));const j=journey(p,drives,(await all<Evidence>('evidence',c.householdId)),jurisdictionRules,(await totals(c.householdId,p.ownerId,drives)));const assignment={...base(c.householdId,user.id),teenId:p.ownerId,agent:j.next.agent,state:j.next.status==='REQUIRES_OFFICIAL_SOURCE'?'REQUIRES_OFFICIAL_SOURCE':'COMPLETED',transitions:['ASSIGNED','ASSESSING','READY','IN_PROGRESS','AWAITING_VERIFICATION','VERIFIED','COMPLETED'],at:now(),rationale:j.next.reason};(await put('assignment',assignment));(await audit(user.id,c.householdId,'agent.result','ALLOW','Scoped deterministic explanation; no unsourced regulatory claims.'));return {agent:j.next.agent,text:`Your next step: ${j.next.title}. ${j.next.reason}`,source:j.rule?.sourceUrl}}
 fail('Unsupported action.',400);
}

export async function dashboard(user:User,requested?:string):Promise<Dashboard>{return (await transaction(async ()=>{
 const memberships=(await all<Member>('member')).filter(m=>m.ownerId===user.id&&m.active);const households=(await all<Household>('household')).filter(h=>memberships.some(m=>m.householdId===h.id));const household=households.find(h=>h.id===requested)||(!requested?households[0]:undefined);if(requested&&!household)fail('Household access denied.');
 const empty:Dashboard={user,households,members:[],profiles:[],relationships:[],drives:[],evidence:[],reminders:[],journeys:[],audit:[]};if(!household)return empty;
 const member=(await membership(user.id,household.id))!;const activeDrive=(await activeFor(user.id));if(activeDrive){(await audit(user.id,household.id,'dashboard.read','DEFER','Only the active drive is visible while driving.'));return {...empty,household,membership:member,activeDrive}}
 const householdLinks=await all<Relationship>('relationship',household.id);const linked=(teenId:string)=>householdLinks.some(r=>r.active&&r.adultId===user.id&&r.teenId===teenId&&r.kind==='guardian');
 const relationships=householdLinks.filter(r=>r.active&&(r.adultId===user.id||r.teenId===user.id||linked(r.teenId)));
 const profiles=(await all<Profile>('profile',household.id)).filter(p=>(p.ownerId===user.id||relationships.some(r=>r.teenId===p.ownerId))&&(p.ownerId===user.id||ageOn(p.birthDate)<18||p.adultSharing));
 const ids=new Set(profiles.map(p=>p.ownerId));const drives=(await all<Drive>('drive',household.id)).filter(d=>ids.has(d.teenId)&&(member.role!=='supervisor'||d.supervisorId===user.id));
 const evidence=member.role==='supervisor'?[]:(await all<Evidence>('evidence',household.id)).filter(e=>ids.has(e.teenId)&&(e.milestone!=='coverage'||member.role==='guardian'));
 const reminders=member.role==='supervisor'?[]:(await all<Reminder>('reminder',household.id)).filter(r=>ids.has(r.teenId)&&r.ownerId===user.id&&processingAllowed(profiles.find(p=>p.ownerId===r.teenId)!)&&!drives.some(d=>d.teenId===r.teenId&&d.status==='active'));
 const visibleMembers=(await all<Member>('member',household.id)).filter(m=>m.ownerId===user.id||ids.has(m.ownerId)||relationships.some(r=>r.adultId===m.ownerId)||member.role==='guardian'&&linked(m.ownerId));
 const result={...empty,household,membership:member,members:visibleMembers,profiles:member.role==='supervisor'?[]:profiles,relationships,drives,evidence,reminders,journeys:member.role==='supervisor'?[]:(await Promise.all(profiles.map(async p=>({teenId:p.ownerId,...journey(p,drives,evidence,jurisdictionRules,(await totals(household.id,p.ownerId,drives))),totals:(await totals(household.id,p.ownerId,drives))})))),audit:(await db().prepare('SELECT * FROM audit WHERE household_id=? AND actor_id=? ORDER BY at DESC LIMIT 30').all(household.id,user.id))};
 (await audit(user.id,household.id,'dashboard.read','ALLOW','Only relationship-scoped resources returned.'));return result;
}))}
