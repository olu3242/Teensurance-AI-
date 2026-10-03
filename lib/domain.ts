export type Role='teen'|'parent';
export type DrivingState='parked'|'driving';
export type Decision='ALLOW'|'DEFER'|'REQUIRE_PARENT'|'REQUIRE_CONSENT'|'REQUIRE_VERIFICATION'|'REQUIRE_OFFICIAL_SOURCE'|'REQUIRES_HUMAN_REVIEW'|'DENY';
export type EvidenceStatus='not_started'|'building'|'evidence_present';
export type SafetyTopic='phone_away'|'seatbelt_setup'|'mirrors_controls'|'supervisor_ready'|'emergency_plan';
export type Confidence='building'|'steady'|'confident';
export type LogStatus='pending'|'verified'|'disputed';

export type Log={id:string;date:string;minutes:number;night:boolean;nightMinutes?:number;skill:string;supervisor:string;note:string;status:LogStatus;createdAt:string;verifiedAt?:string;disputedAt?:string;reviewedBy?:Role;disputeReason?:string};
export type Audit={id:string;at:string;action:string;actor:Role;drivingState:DrivingState;decision:Decision;reason:string};
export type PracticePlan={id:string;skill:string;objective:string;supervisor:string;createdAt:string;completedAt?:string};
export type SafetyCheck={topic:SafetyTopic;completedBy:Role;completedAt:string};
export type Reflection={logId:string;confidence:Confidence;challenge:string;nextFocus:string;createdAt:string};
export type Correction={id:string;logId:string;actor:Role;reason:string;createdAt:string;before:{minutes:number;night:boolean;skill:string;supervisor:string;note:string};after:{minutes:number;night:boolean;skill:string;supervisor:string;note:string}};
export type EvidenceRecord={id:string;kind:'supervisor_verification'|'supervisor_dispute'|'supervisor_correction'|'consent'|'requirement_source';subjectId:string;actor:Role;createdAt:string;summary:string};
export type CoverChecklist={householdReviewed:boolean;vehicleInfoReady:boolean;questionsPrepared:boolean};
export type DomainEventRecord={id:string;type:string;at:string;actor:Role;subjectId?:string;metadata?:Record<string,string|number|boolean>};
export type JurisdictionSelection={name:string;status:'unverified'|'verified';officialSourceUrl?:string;verifiedAt?:string};
export type ConsentState={guardianAcknowledged:boolean;teenAcknowledged:boolean;dataPurposeVersion:string;updatedAt?:string};
export type GuardianState={relationshipStatus:'unverified'|'verified';verifiedAt?:string};
export type ReviewCase={id:string;kind:'requirement_source'|'exception'|'consent'|'safety';status:'open'|'resolved';reason:string;createdAt:string;resolvedAt?:string};
export type RequirementSource={id:string;jurisdiction:string;url:string;title:string;status:'pending_review'|'verified'|'rejected';effectiveDate?:string;expiresAt?:string;reviewedAt?:string};
export type ExceptionCase={id:string;code:string;message:string;status:'open'|'resolved';createdAt:string;resolvedAt?:string};
export type NotificationRecord={id:string;kind:string;recipient:Role;status:'queued'|'deferred'|'delivered'|'suppressed';reason:string;createdAt:string};
export type WorkflowInstance={id:string;workflow:string;state:string;owner:string;updatedAt:string;lastEvent?:string};
export type LessonAttempt={lessonId:string;scenarioId?:string;choiceId?:string;safe?:boolean;completedAt?:string;updatedAt:string};

export type State={
 logs:Log[];audit:Audit[];goalHours:number;activePlan?:PracticePlan;safetyChecks:SafetyCheck[];reflections:Reflection[];
 corrections:Correction[];evidence:EvidenceRecord[];cover:CoverChecklist;processedRequestIds:string[];
 events:DomainEventRecord[];jurisdiction?:JurisdictionSelection;consent:ConsentState;guardian:GuardianState;
 reviewQueue:ReviewCase[];requirementSources:RequirementSource[];exceptions:ExceptionCase[];notifications:NotificationRecord[];
 workflowInstances:WorkflowInstance[];lessonAttempts:LessonAttempt[];
};

export const initialState=():State=>({
 logs:[],audit:[],goalHours:20,safetyChecks:[],reflections:[],corrections:[],evidence:[],
 cover:{householdReviewed:false,vehicleInfoReady:false,questionsPrepared:false},
 processedRequestIds:[],events:[],consent:{guardianAcknowledged:false,teenAcknowledged:false,dataPurposeVersion:'mvp-v1'},
 guardian:{relationshipStatus:'unverified'},reviewQueue:[],requirementSources:[],exceptions:[],notifications:[],workflowInstances:[],lessonAttempts:[]
});

export function normalizeState(value:Partial<State>|undefined|null):State{
 const base=initialState();
 if(!value||typeof value!=='object')return base;
 return{
  logs:Array.isArray(value.logs)?value.logs:base.logs,
  audit:Array.isArray(value.audit)?value.audit:base.audit,
  goalHours:Number.isFinite(value.goalHours)&&Number(value.goalHours)>0?Number(value.goalHours):base.goalHours,
  activePlan:value.activePlan,
  safetyChecks:Array.isArray(value.safetyChecks)?value.safetyChecks:base.safetyChecks,
  reflections:Array.isArray(value.reflections)?value.reflections:base.reflections,
  corrections:Array.isArray(value.corrections)?value.corrections:base.corrections,
  evidence:Array.isArray(value.evidence)?value.evidence:base.evidence,
  cover:value.cover&&typeof value.cover==='object'?{...base.cover,...value.cover}:base.cover,
  processedRequestIds:Array.isArray(value.processedRequestIds)?value.processedRequestIds:base.processedRequestIds,
  events:Array.isArray(value.events)?value.events:base.events,
  jurisdiction:value.jurisdiction,
  consent:value.consent&&typeof value.consent==='object'?{...base.consent,...value.consent}:base.consent,
  guardian:value.guardian&&typeof value.guardian==='object'?{...base.guardian,...value.guardian}:base.guardian,
  reviewQueue:Array.isArray(value.reviewQueue)?value.reviewQueue:base.reviewQueue,
  requirementSources:Array.isArray(value.requirementSources)?value.requirementSources:base.requirementSources,
  exceptions:Array.isArray(value.exceptions)?value.exceptions:base.exceptions,
  notifications:Array.isArray(value.notifications)?value.notifications:base.notifications,
  workflowInstances:Array.isArray(value.workflowInstances)?value.workflowInstances:base.workflowInstances,
  lessonAttempts:Array.isArray(value.lessonAttempts)?value.lessonAttempts:base.lessonAttempts
 };
}

export const safetyTopics:{id:SafetyTopic;label:string;owner:Role;description:string}[]=[
 {id:'phone_away',label:'Phone put away',owner:'teen',description:'Set navigation and music before moving, then keep the phone out of reach.'},
 {id:'seatbelt_setup',label:'Seat belt and seating set',owner:'teen',description:'Buckle up and set a stable driving position before the vehicle moves.'},
 {id:'mirrors_controls',label:'Mirrors and controls checked',owner:'teen',description:'Adjust mirrors and locate essential controls while parked.'},
 {id:'supervisor_ready',label:'Supervisor is ready',owner:'parent',description:'Guardian confirms an appropriate supervisor and practice plan are in place.'},
 {id:'emergency_plan',label:'Emergency plan discussed',owner:'parent',description:'Guardian confirms the teen knows what to do after a breakdown, crash, or unsafe situation.'}
];

export const steps=[
 {id:'prepare',name:'Prepare for the permit',agent:'READY',detail:'Confirm local licensing rules with the official motor vehicle agency and build a study plan with a parent or guardian.',proof:'Record the official source and completed permit requirements.'},
 {id:'learn',name:'Learn the essentials',agent:'ACE',detail:'Review road signs, right of way, distraction risks, emergency basics, and insurance fundamentals before practice.',proof:'Complete a knowledge check with a parent, guardian, or instructor.'},
 {id:'practice',name:'Practice with a supervisor',agent:'MILES',detail:'Plan one skill while parked, complete the drive without app interaction, then log and reflect after parking.',proof:'A supervisor confirms each session before it counts toward family practice progress.'},
 {id:'license',name:'Check license readiness',agent:'GO',detail:'Check current requirements in your jurisdiction and use official channels for required tests or appointments.',proof:'Official eligibility and test results. Teensurance does not determine legal eligibility.'},
 {id:'coverage',name:'Prepare for coverage',agent:'COVER',detail:'A parent or guardian prepares household and vehicle information before speaking with an insurer.',proof:'Parent confirms the coverage preparation checklist.'}
] as const;

const teenSafetyTopics=new Set<SafetyTopic>(['phone_away','seatbelt_setup','mirrors_controls']);
const parentSafetyTopics=new Set<SafetyTopic>(['supervisor_ready','emergency_plan']);

export function guard(action:string,role:Role,drivingState:DrivingState,state:State,payload:Record<string,unknown>):{decision:Decision;reason:string}{
 if(drivingState==='driving')return{decision:'DEFER',reason:'Put the phone away while driving. Resume only after the vehicle is safely parked.'};
 if(['log','plan','safety','reflect'].includes(action)&&!state.consent.teenAcknowledged)return{decision:'REQUIRE_CONSENT',reason:'Teen acknowledgment of the pilot data purpose is required before recording journey data.'};
 if(['verify','correct','dispute','cover','guardian','consent_guardian'].includes(action)&&role!=='parent')return{decision:'REQUIRE_PARENT',reason:'A parent or guardian must complete this action.'};
 if(['verify','correct','dispute','cover'].includes(action)&&!state.consent.guardianAcknowledged)return{decision:'REQUIRE_CONSENT',reason:'Guardian acknowledgment of the pilot data purpose is required first.'};
 if(action==='plan'){
  if(role!=='teen')return{decision:'DENY',reason:'The teen creates the practice plan in this pilot.'};
  if(!payload.supervisor||!payload.skill||!payload.objective)return{decision:'REQUIRE_VERIFICATION',reason:'Choose one practice skill, one objective, and a supervisor before starting.'};
  return{decision:'ALLOW',reason:'Practice plan saved. Put the phone away before the vehicle moves.'};
 }
 if(action==='safety'){
  const topic=payload.topic as SafetyTopic;
  if(!safetyTopics.some(item=>item.id===topic))return{decision:'DENY',reason:'Unknown safety check.'};
  if(teenSafetyTopics.has(topic)&&role!=='teen')return{decision:'DENY',reason:'This check belongs to the teen.'};
  if(parentSafetyTopics.has(topic)&&role!=='parent')return{decision:'REQUIRE_PARENT',reason:'A parent or guardian must confirm this safety item.'};
  return{decision:'ALLOW',reason:'Safety preparation recorded.'};
 }
 if(action==='log'){
  if(role!=='teen')return{decision:'DENY',reason:'Only the teen creates a practice entry in this pilot.'};
  if(!payload.supervisor)return{decision:'REQUIRE_VERIFICATION',reason:'A supervisor name is required for a supervised entry.'};
  return{decision:'ALLOW',reason:'The entry will await parent review.'};
 }
 if(action==='reflect'){
  if(role!=='teen')return{decision:'DENY',reason:'The teen records the post-drive reflection.'};
  if(!state.logs.some(log=>log.id===payload.logId))return{decision:'DENY',reason:'Choose a recorded drive before adding a reflection.'};
  return{decision:'ALLOW',reason:'Reflection saved for the next parked planning session.'};
 }
 if(action==='verify'){
  if(!state.logs.some(l=>l.id===payload.id&&l.status==='pending'))return{decision:'DENY',reason:'No pending entry matches this request.'};
  return{decision:'ALLOW',reason:'Parent review recorded.'};
 }
 if(action==='correct'){
  if(!state.logs.some(l=>l.id===payload.id&&l.status!=='disputed'))return{decision:'DENY',reason:'No reviewable entry matches this correction.'};
  if(!payload.reason)return{decision:'REQUIRE_VERIFICATION',reason:'A correction reason is required for the audit trail.'};
  return{decision:'ALLOW',reason:'Correction recorded with provenance.'};
 }
 if(action==='dispute'){
  if(!state.logs.some(l=>l.id===payload.id&&(l.status==='pending'||l.status==='verified')))return{decision:'DENY',reason:'Only a pending or verified entry can be disputed.'};
  if(!payload.reason)return{decision:'REQUIRE_VERIFICATION',reason:'A dispute reason is required.'};
  return{decision:'ALLOW',reason:'Entry disputed and excluded from verified progress.'};
 }
 if(action==='jurisdiction'){
  if(!payload.name){
    return{
      decision:'REQUIRE_OFFICIAL_SOURCE',
      reason:'Choose a jurisdiction before reviewing official requirements.'
    };
  }

  if(payload.officialSourceUrl){
    return{
      decision:'REQUIRE_OFFICIAL_SOURCE',
      reason:'A regulatory source must be reviewed before it can become authoritative.'
    };
  }

  return{
    decision:'ALLOW',
    reason:'Jurisdiction recorded as unverified. No legal eligibility decision will be made.'
  };
}
 if(action==='requirement_source')return role==='parent'?{decision:'REQUIRES_HUMAN_REVIEW',reason:'Official-source candidates must be reviewed before becoming authoritative.'}:{decision:'REQUIRE_PARENT',reason:'A parent or administrator must submit requirement-source candidates.'};
 if(action==='consent_teen')return role==='teen'?{decision:'ALLOW',reason:'Teen pilot acknowledgment recorded.'}:{decision:'DENY',reason:'Teen acknowledgment must be completed in Teen view.'};
 if(action==='consent_guardian')return role==='parent'?{decision:'ALLOW',reason:'Guardian pilot acknowledgment recorded.'}:{decision:'REQUIRE_PARENT',reason:'Guardian acknowledgment requires Parent view.'};
 if(action==='guardian')return role==='parent'?{decision:'ALLOW',reason:'Guardian relationship attestation recorded for the local pilot only.'}:{decision:'REQUIRE_PARENT',reason:'Guardian relationship attestation requires Parent view.'};
 if(action==='cover')return{decision:'ALLOW',reason:'Insurance-preparation checklist updated. No quote, price, eligibility, recommendation, or binding decision was made.'};
 if(action==='goal')return role==='parent'?{decision:'ALLOW',reason:'Family practice goal updated.'}:{decision:'REQUIRE_PARENT',reason:'A parent sets the family practice goal.'};
 if(action==='resolve_review'||action==='resolve_exception')return role==='parent'?{decision:'ALLOW',reason:'Pilot operational review updated.'}:{decision:'REQUIRE_PARENT',reason:'Operational review requires Parent view in this local pilot.'};
 return{decision:'DENY',reason:'Unknown action.'};
}

export function progress(state:State){
 const verified=state.logs.filter(l=>l.status==='verified');
 const minutes=verified.reduce((sum,l)=>sum+l.minutes,0);
 const nightMinutes=verified.reduce((sum,l)=>sum+(l.nightMinutes??(l.night?l.minutes:0)),0);
 const goalMinutes=Math.max(1,state.goalHours*60);
 return{verifiedMinutes:minutes,nightMinutes,pending:state.logs.filter(l=>l.status==='pending').length,disputed:state.logs.filter(l=>l.status==='disputed').length,percent:Math.min(100,Math.round(minutes/goalMinutes*100))};
}

export function readinessPassport(state:State){
 const verified=state.logs.filter(log=>log.status==='verified');
 const teenChecks=state.safetyChecks.filter(check=>teenSafetyTopics.has(check.topic));
 const guardianChecks=state.safetyChecks.filter(check=>parentSafetyTopics.has(check.topic));
 const reflectedVerified=state.reflections.filter(reflection=>verified.some(log=>log.id===reflection.logId));
 const dimensions=[
  {id:'safe_setup',label:'Safe setup habits',status:(teenChecks.length===3?'evidence_present':teenChecks.length>0?'building':'not_started') as EvidenceStatus,detail:`${teenChecks.length} of 3 teen safety checks recorded`},
  {id:'supervised_practice',label:'Verified supervised practice',status:(verified.length>0?'evidence_present':state.logs.some(l=>l.status==='pending')?'building':'not_started') as EvidenceStatus,detail:verified.length>0?`${verified.length} verified ${verified.length===1?'session':'sessions'}`:state.logs.some(l=>l.status==='pending')?'Practice recorded and awaiting verification':'No verified practice yet'},
  {id:'reflection',label:'Post-drive reflection',status:(reflectedVerified.length>0?'evidence_present':state.reflections.length>0?'building':'not_started') as EvidenceStatus,detail:reflectedVerified.length>0?`${reflectedVerified.length} ${reflectedVerified.length===1?'reflection':'reflections'} linked to verified practice`:'Reflection helps choose the next safe practice focus'},
  {id:'guardian',label:'Guardian safety participation',status:(guardianChecks.length===2&&verified.length>0?'evidence_present':guardianChecks.length>0||verified.length>0?'building':'not_started') as EvidenceStatus,detail:`${guardianChecks.length} of 2 guardian safety attestations recorded`}
 ];
 const evidencePresent=dimensions.filter(item=>item.status==='evidence_present').length;
 const next=dimensions.find(item=>item.status!=='evidence_present');
 return{dimensions,evidencePresent,evidenceTotal:dimensions.length,verifiedSessions:verified.length,reflectionCount:reflectedVerified.length,safetyChecks:state.safetyChecks.length,nextSafeStep:next?next.label:'Keep practicing safely and follow official licensing requirements.',legalEligibility:false,disclaimer:'This passport summarizes evidence recorded in the family pilot. It is not a licensing decision, insurance score, or prediction of driving safety.'};
}

export function nextBestStep(state:State){
 if(!state.consent.teenAcknowledged)return{agent:'VIBE',id:'teen_consent',title:'Review the pilot data purpose',why:'Journey data should not be recorded until the teen understands this local pilot.',action:'journey'} as const;
 if(state.safetyChecks.filter(x=>teenSafetyTopics.has(x.topic)).length<3)return{agent:'CRUZE',id:'safe_setup',title:'Complete your parked safety setup',why:'Preparation should happen before the vehicle moves.',action:'prepare'} as const;
 if(!state.activePlan)return{agent:'CRUZE',id:'plan',title:'Make one simple practice plan',why:'Choose one skill, one objective and one supervisor while parked.',action:'prepare'} as const;
 if(state.logs.length===0)return{agent:'MILES',id:'practice',title:'Log your supervised practice after parking',why:'The family needs a reviewable record before practice can count.',action:'log'} as const;
 if(state.logs.some(x=>x.status==='pending'))return{agent:'MILES',id:'parent_review',title:'Ask a parent to review the pending drive',why:'Pending time does not count toward verified practice.',action:'family'} as const;
 const verified=state.logs.filter(x=>x.status==='verified');
 if(verified.some(log=>!state.reflections.some(ref=>ref.logId===log.id)))return{agent:'CRUZE',id:'reflection',title:'Reflect on the last verified drive',why:'Reflection turns practice into a clearer next focus.',action:'family'} as const;
 if(!state.consent.guardianAcknowledged||state.guardian.relationshipStatus!=='verified')return{agent:'VIBE',id:'guardian',title:'Complete guardian pilot setup',why:'Guardian participation should be explicit before family review and insurance preparation.',action:'family'} as const;
 const guardianChecks=state.safetyChecks.filter(x=>parentSafetyTopics.has(x.topic));
 if(guardianChecks.length<2)return{agent:'VIBE',id:'guardian_setup',title:'Complete guardian safety checks',why:'Family participation is part of readiness evidence.',action:'prepare'} as const;
 return{agent:'GO',id:'official_rules',title:'Check the next licensing requirement with an official source',why:'Teensurance has not verified a jurisdiction for this pilot and will not infer legal eligibility.',action:'journey',decision:'REQUIRE_OFFICIAL_SOURCE'} as const;
}

export function coverReadiness(state:State){const completed=Object.values(state.cover).filter(Boolean).length;return{completed,total:3,readyForConversation:completed===3,disclaimer:'COVER prepares questions and household information only. It does not quote, recommend, bind, or determine insurance eligibility.'};}
export function coverStatus(state:State){const readiness=coverReadiness(state);const active=state.logs.some(x=>x.status==='verified')&&state.safetyChecks.filter(x=>teenSafetyTopics.has(x.topic)).length===3&&state.consent.guardianAcknowledged;return{...readiness,active,quoteEnabled:false};}
export function pilotAnalytics(state:State){return{drivesRecorded:state.logs.length,drivesVerified:state.logs.filter(x=>x.status==='verified').length,drivesPending:state.logs.filter(x=>x.status==='pending').length,drivesDisputed:state.logs.filter(x=>x.status==='disputed').length,reflections:state.reflections.length,safetyChecks:state.safetyChecks.length,guardDeferrals:state.audit.filter(x=>x.decision==='DEFER').length,guardDenials:state.audit.filter(x=>x.decision==='DENY').length,openReviews:state.reviewQueue.filter(x=>x.status==='open').length,openExceptions:state.exceptions.filter(x=>x.status==='open').length};}
export function pilotReadiness(){const functional={journey:true,nextBestStep:true,guard:true,driveLogging:true,supervisorReview:true,correctionsAndDisputes:true,evidenceProvenance:true,passport:true,coverPreparation:true,auditTrail:true,workflowOS:true,humanReviewQueue:true};const productionBlockers=['Authenticated teen/guardian identity and verified relationships','Durable transactional database with household isolation/RLS','Production consent, retention and minor-data controls','Human-verified official-source-backed jurisdiction requirement records','Production-grade driving-state detection strategy','Accessibility, security and real-family pilot certification'];return{functional,productionReady:false,productionBlockers,localPilotReady:Object.values(functional).every(Boolean)};}

const prohibitedMechanics=new Set(['speed_score','miles_competition','drive_count_streak','leaderboard','trip_count_reward','in_drive_prompt']);
export function engagementPolicy(mechanic:string):{decision:'ALLOW'|'DENY';reason:string}{if(prohibitedMechanics.has(mechanic))return{decision:'DENY',reason:'Teensurance does not use engagement mechanics that can reward more, faster, competitive, or distracted driving.'};return{decision:'ALLOW',reason:'Mechanic does not conflict with the current safety deny-list.'};}
