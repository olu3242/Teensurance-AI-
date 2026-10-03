import type {Drive,Evidence,Milestone,Profile,Rule} from './types';
import {normalizeJurisdiction} from './jurisdictions';
import {projectPractice} from './practice';
export function ageOn(birthDate:string,now=new Date()){const birth=new Date(`${birthDate}T00:00:00Z`);return now.getUTCFullYear()-birth.getUTCFullYear()-(now.getUTCMonth()<birth.getUTCMonth()||(now.getUTCMonth()===birth.getUTCMonth()&&now.getUTCDate()<birth.getUTCDate())?1:0)}
export function journey(profile:Profile,drives:Drive[],evidence:Evidence[],rules:Rule[],totals:{verifiedMinutes:number;nightMinutes:number;weatherMinutes?:number},now=new Date()){
 const jurisdiction=normalizeJurisdiction(profile.jurisdiction);const rule=rules.filter(r=>r.jurisdiction===jurisdiction&&r.status==='verified'&&r.effectiveFrom<=now.toISOString().slice(0,10)&&r.validUntil>now.toISOString()).sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt))[0];
 const practice=projectPractice(rule,{verifiedMinutes:totals.verifiedMinutes,nightMinutes:totals.nightMinutes,weatherMinutes:totals.weatherMinutes||0});
 const nodes:Milestone[]=[];
 const add=(id:string,title:string,agent:string,dependencies:string[],extra=true,blockedReason='Complete the earlier steps first.')=>{const accepted=evidence.some(e=>e.teenId===profile.ownerId&&e.milestone===id&&e.status==='accepted');const pending=evidence.some(e=>e.teenId===profile.ownerId&&e.milestone===id&&e.status==='pending');const deps=dependencies.every(dep=>nodes.find(n=>n.id===dep)?.status==='COMPLETED');const status=!deps||!extra?'BLOCKED':accepted?'COMPLETED':pending?'AWAITING_VERIFICATION':'READY';nodes.push({id,title,agent,dependencies,status,reason:status==='BLOCKED'?blockedReason:status==='COMPLETED'?'Family-reviewed evidence recorded.':status==='AWAITING_VERIFICATION'?'Your guardian is reviewing the evidence.':'Add evidence, then ask your guardian to review.'})};
 add('prepare','Prepare for your permit','READY',[]);
 add('learn','Learn the essentials','ACE',[]);
 const practiceDone=totals.verifiedMinutes>=profile.goalMinutes;
 nodes.push({id:'practice',title:'Build supervised experience',agent:'MILES',dependencies:['prepare','learn'],status:nodes.slice(0,2).every(n=>n.status==='COMPLETED')?(practiceDone?'COMPLETED':'READY'):'BLOCKED',reason:practiceDone?'Your family practice goal is met; this is not licensing eligibility.':`${Math.max(0,profile.goalMinutes-totals.verifiedMinutes)} verified minutes to your family goal.`});
 if(!rule)nodes.push({id:'license',title:'Check licensing requirements',agent:'GO',dependencies:['prepare','learn','practice'],status:'REQUIRES_OFFICIAL_SOURCE',reason:'No current reviewed jurisdiction rules are available. Confirm with your official licensing authority.'});
 else {
  const heldUntil=profile.permitDate?new Date(`${profile.permitDate}T00:00:00Z`):undefined;
  if(heldUntil){heldUntil.setUTCMonth(heldUntil.getUTCMonth()+(rule.holdingMonths||0));heldUntil.setUTCDate(heldUntil.getUTCDate()+profile.suspensionDays)}
  const supporting=(rule.requiredEvidence||[]).every(id=>evidence.some(e=>e.teenId===profile.ownerId&&e.milestone===id&&e.status==='accepted'&&(id!=='impact'||Date.parse(e.createdAt)>+now-90*86400000)));
  add('license','Review licensing readiness','GO',['prepare','learn','practice'],ageOn(profile.birthDate,now)>=rule.minimumAge&&ageOn(profile.birthDate,now)<18&&!!heldUntil&&heldUntil<=now&&supporting&&totals.verifiedMinutes>=rule.totalMinutes&&totals.nightMinutes>=rule.nightMinutes&&(totals.weatherMinutes||0)>=(rule.weatherMinutes||0),'Review age, permit holding period, supervised practice and required evidence with the official state authority. Family-reviewed evidence never establishes legal eligibility.');
 }
 add('coverage','Prepare insurance questions','COVER',[]);
 return {milestones:nodes,practice,next:nodes.find(n=>n.status==='READY')||nodes.find(n=>n.status!=='COMPLETED')||nodes[0],rule};
}
