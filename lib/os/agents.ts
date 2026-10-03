import type {AgentId,PilotAction} from './types';

export type AgentContract={id:AgentId;purpose:string;allowedActions:PilotAction[];prohibitedWhileDriving:boolean};
export const agentRegistry:AgentContract[]=[
 {id:'T',purpose:'Single user-facing assistant and explanation layer.',allowedActions:[],prohibitedWhileDriving:true},
 {id:'VIBE',purpose:'Journey state and next-best-step intelligence.',allowedActions:['goal'],prohibitedWhileDriving:true},
 {id:'READY',purpose:'Permit and pre-driving preparation.',allowedActions:['jurisdiction'],prohibitedWhileDriving:true},
 {id:'ACE',purpose:'Foundational learning and explanation.',allowedActions:[],prohibitedWhileDriving:true},
 {id:'MILES',purpose:'Practice logging and supervisor verification workflow.',allowedActions:['log','verify','correct','dispute'],prohibitedWhileDriving:true},
 {id:'CRUZE',purpose:'Parked pre-drive planning and post-drive reflection.',allowedActions:['plan','safety','reflect'],prohibitedWhileDriving:true},
 {id:'GO',purpose:'Licensing milestone guidance using verified rules only.',allowedActions:['jurisdiction'],prohibitedWhileDriving:true},
 {id:'COVER',purpose:'Parent insurance preparation and education.',allowedActions:['cover'],prohibitedWhileDriving:true},
 {id:'GUARD',purpose:'Deterministic safety kernel governing every action.',allowedActions:[],prohibitedWhileDriving:false}
];

export function agentFor(id:AgentId){return agentRegistry.find(a=>a.id===id)!}
