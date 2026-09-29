import type {ConceptMastery,LearningEvidence,RoadLearningConcept} from './types';
import type {Recommendation,PracticeSession} from './intelligence-types';
import type {HazardScene} from './core/hazards';
export type ScoutChoice=Pick<Recommendation,'type'|'conceptId'|'title'|'reason'|'priority'>;
export function chooseScout(input:{concepts:RoadLearningConcept[];hazards:HazardScene[];mastery:ConceptMastery[];evidence:LearningEvidence[];sessions:PracticeSession[];guardian:boolean;safetyReason?:string;now:string}):ScoutChoice{
 const {concepts,hazards,mastery,evidence,sessions,guardian,safetyReason}=input;
 if(safetyReason)return {type:'review_before_drive',conceptId:'',title:'Review your preparation',reason:safetyReason,priority:0};
 const weak=mastery.filter(m=>!['demonstrated','reinforced'].includes(m.state)).map(m=>({m,misses:evidence.filter(e=>e.conceptId===m.conceptId&&!e.correct&&Date.parse(e.at)>=Date.parse(input.now)-30*86400000&&e.at>(evidence.filter(x=>x.conceptId===m.conceptId&&x.correct).map(x=>x.at).sort().at(-1)||'')).length})).filter(x=>x.misses>=2).sort((a,b)=>b.misses-a.misses||a.m.conceptId.localeCompare(b.m.conceptId))[0];
 if(weak&&!guardian){const c=concepts.find(c=>c.id===weak.m.conceptId);const h=hazards.find(h=>h.conceptId===weak.m.conceptId);return {type:h?'start_hazard_scene':'retry_weak_concept',conceptId:weak.m.conceptId,title:`Review ${c?.name||h?.title||'this concept'}`,reason:`${weak.misses} recent responses need another look. Try alternate examples.`,priority:h?3:2}}
 const active=sessions.find(s=>!s.completedAt);
 if(active&&!guardian)return {type:'resume_session',conceptId:active.id,title:'Continue your learning session',reason:'You have an unfinished activity.',priority:4};
 const demonstrated=mastery.find(m=>m.state==='demonstrated');
 if(guardian&&demonstrated)return {type:'guardian_reinforcement',conceptId:demonstrated.conceptId,title:'Reinforce a demonstrated concept',reason:'Later learning observations demonstrate understanding; a separate family activity can reinforce it.',priority:5};
 const gap=concepts.find(c=>!evidence.some(e=>e.conceptId===c.id));
 if(gap)return {type:guardian?'guardian_reinforcement':'continue_category',conceptId:gap.id,title:`Explore ${gap.name}`,reason:`This ${gap.category.replaceAll('_',' ')} topic has no learning observation yet.`,priority:6};
 const hazard=hazards.find(h=>!evidence.some(e=>e.conceptId===h.conceptId));
 if(hazard&&!guardian)return {type:'start_hazard_scene',conceptId:hazard.conceptId,title:`Notice ${hazard.title}`,reason:'Broaden your road awareness with a new scene.',priority:7};
 const c=concepts.find(c=>mastery.find(m=>m.conceptId===c.id)?.state!=='reinforced')||concepts[0];
 return {type:guardian?'guardian_reinforcement':c?'practice_concept':'start_hazard_scene',conceptId:c?.id||hazards[0]?.conceptId||'',title:'Continue thoughtful practice',reason:'Review a familiar idea in a different example while away from driving.',priority:8};
}
export function keepRecommendation(previous:Recommendation|undefined,next:ScoutChoice,now:string){return !!previous&&['recommended','started'].includes(previous.status)&&previous.expiresAt>now&&previous.priority<=next.priority}
