import type {WorkflowDefinition} from './types';

export const workflowRegistry:WorkflowDefinition[]=[
 {id:'onboarding',version:1,owner:'VIBE',allowedActions:['jurisdiction','consent_teen','consent_guardian','guardian'],completion:s=>Boolean(s.jurisdiction),blockers:()=>[]},
 {id:'permit',version:1,owner:'READY',allowedActions:['jurisdiction','requirement_source'],completion:s=>s.jurisdiction?.status==='verified',blockers:s=>s.jurisdiction?.status==='verified'?[]:['Official-source-backed jurisdiction rules are not verified.']},
 {id:'learning',version:1,owner:'ACE',allowedActions:[],completion:()=>false,blockers:()=>['Structured learning completion is not implemented in the local pilot.']},
 {id:'practice',version:1,owner:'CRUZE',allowedActions:['plan','safety','log'],completion:s=>s.logs.length>0,blockers:s=>s.safetyChecks.length<3?['Teen parked safety setup is incomplete.']:[]},
 {id:'verification',version:1,owner:'MILES',allowedActions:['verify','correct','dispute'],completion:s=>!s.logs.some(l=>l.status==='pending'),blockers:s=>s.logs.some(l=>l.status==='pending')?['A practice entry is awaiting parent review.']:[]},
 {id:'reflection',version:1,owner:'CRUZE',allowedActions:['reflect'],completion:s=>s.logs.filter(l=>l.status==='verified').every(l=>s.reflections.some(r=>r.logId===l.id)),blockers:()=>[]},
 {id:'licensing',version:1,owner:'GO',allowedActions:['jurisdiction'],completion:s=>s.jurisdiction?.status==='verified',blockers:s=>s.jurisdiction?.status==='verified'?[]:['Verified official requirements are required before legal-readiness claims.']},
 {id:'coverage',version:1,owner:'COVER',allowedActions:['cover','resolve_review','resolve_exception'],completion:s=>Object.values(s.cover).every(Boolean),blockers:()=>[]},
 {id:'savings',version:1,owner:'SAVE',allowedActions:[],completion:()=>false,blockers:()=>['Savings actions require evidence-backed carrier, regulator, quote, or household inputs and parent approval.']}
];

export function workflowForAction(action:string){
 return workflowRegistry.find(w=>w.allowedActions.includes(action as never)) ?? workflowRegistry[0];
}
