import type {ConceptMastery,GuardianReinforcement,LearningEvidence} from './types';
export const observationGapMs = 24 * 60 * 60 * 1000;
export const prohibitedActions = ['speed_score','miles_competition','drive_count_streak','leaderboard','fastest_answer_ranking','trip_count_reward','in_drive_prompt','insurance_risk_score','legal_eligibility','teen_ranking','safe_driver_label','premium_prediction'] as const;
export function learningPolicy(action:string,driving:boolean){
 if(driving)return {decision:'DEFER' as const,reason:'Resume RoadReady after the drive has ended and you are safely parked.'};
 if(!['read','start','answer','reinforce','accept_recommendation'].includes(action))return {decision:'DENY' as const,reason:'Scout only supports educational learning and parked reinforcement.'};
 return {decision:'ALLOW' as const,reason:'Educational action; no driving, insurance, or eligibility scoring.'};
}
/** Deterministic projection of immutable observations. Distinct variants on different days
 * are required; refreshing/replaying one item cannot establish demonstration. */
export function mastery(conceptId:string,learning:LearningEvidence[],guardian:GuardianReinforcement[]):ConceptMastery {
 const events=[...learning.filter(e=>e.conceptId===conceptId),...guardian.filter(e=>e.conceptId===conceptId)].sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
 let state:ConceptMastery['state']='not_started';let qualifying:LearningEvidence[]=[];let retryAt:string|undefined;
 for(const event of events){
  if(event.kind==='guardian'){
   if(!event.completed){state='practicing';qualifying=[];retryAt=event.at}
   else if(state==='demonstrated'||state==='reinforced')state='reinforced';
   else if(state==='not_started')state='introduced';
   continue;
  }
  if(!event.correct){state='practicing';qualifying=[];retryAt=new Date(Date.parse(event.at)+observationGapMs).toISOString();continue}
  const last=qualifying.at(-1);
  if(!qualifying.some(e=>e.challengeId===event.challengeId||e.sessionId===event.sessionId)&&(!last||Date.parse(event.at)-Date.parse(last.at)>=observationGapMs))qualifying.push(event);
  if(qualifying.length>=4)state='reinforced';
  else if(qualifying.length>=3){state='demonstrated';retryAt=undefined}
  else if(state!=='practicing')state='introduced';
 }
 return {conceptId,state,qualifyingObservations:qualifying.length,evidenceIds:events.map(e=>e.id),retryAt};
}
