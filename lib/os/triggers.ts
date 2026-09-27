import type {TriggerDefinition} from './types';

export const triggerRegistry:TriggerDefinition[]=[
 {id:'driving.interaction.requested',priority:'P0',source:'safety',workflow:'practice',agent:'GUARD',condition:(_s,c)=>c.drivingState==='driving'},
 {id:'requirement.unverified',priority:'P2',source:'state',workflow:'licensing',agent:'GO',condition:(s,c)=>c.action==='jurisdiction'&&s.jurisdiction?.status!=='verified'},
 {id:'practice.plan.requested',priority:'P4',source:'user',workflow:'practice',agent:'CRUZE',condition:(_s,c)=>c.action==='plan'},
 {id:'safety.setup.updated',priority:'P0',source:'safety',workflow:'practice',agent:'CRUZE',condition:(_s,c)=>c.action==='safety'},
 {id:'drive.logged',priority:'P4',source:'user',workflow:'practice',agent:'MILES',condition:(_s,c)=>c.action==='log'},
 {id:'drive.review.requested',priority:'P5',source:'user',workflow:'verification',agent:'MILES',condition:(_s,c)=>['verify','correct','dispute'].includes(c.action)},
 {id:'reflection.requested',priority:'P6',source:'user',workflow:'reflection',agent:'CRUZE',condition:(_s,c)=>c.action==='reflect'},
 {id:'coverage.preparation.updated',priority:'P6',source:'user',workflow:'coverage',agent:'COVER',condition:(_s,c)=>c.action==='cover'},
 {id:'family.goal.updated',priority:'P4',source:'user',workflow:'practice',agent:'VIBE',condition:(_s,c)=>c.action==='goal'},
 {id:'jurisdiction.selected',priority:'P2',source:'user',workflow:'onboarding',agent:'READY',condition:(_s,c)=>c.action==='jurisdiction'}
];

const priorityOrder=['P0','P1','P2','P3','P4','P5','P6','P7','P8','P9'];
export function resolveTrigger(state:Parameters<NonNullable<TriggerDefinition['condition']>>[0],command:Parameters<NonNullable<TriggerDefinition['condition']>>[1]){
 const candidates=triggerRegistry.filter(t=>!t.condition||t.condition(state,command));
 return candidates.sort((a,b)=>priorityOrder.indexOf(a.priority)-priorityOrder.indexOf(b.priority))[0] ?? triggerRegistry[triggerRegistry.length-1];
}
