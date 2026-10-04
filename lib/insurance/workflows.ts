import type {InsuranceAgentId} from './agents';

export type InsuranceWorkflowId='insurance_acquisition'|'quote_marketplace'|'carrier_bind'|'policy_lifecycle'|'renewal_reshop'|'value_evidence'|'insurance_notifications';
export type InsuranceWorkflowState='CREATED'|'ASSESSING'|'READY'|'IN_PROGRESS'|'AWAITING_GUARDIAN'|'AWAITING_CARRIER'|'COMPLETED'|'BLOCKED'|'FAILED';

export type InsuranceWorkflowDefinition={
  id:InsuranceWorkflowId;
  version:number;
  owner:InsuranceAgentId;
  actions:string[];
  terminalActions:string[];
};

export const insuranceWorkflowRegistry:InsuranceWorkflowDefinition[]=[
  {id:'insurance_acquisition',version:1,owner:'COVER',actions:['insurance.start','insurance.context.complete'],terminalActions:['insurance.context.complete']},
  {id:'quote_marketplace',version:1,owner:'QUOTE',actions:['quote.request','quote.compare','offer.select'],terminalActions:['offer.select']},
  {id:'carrier_bind',version:1,owner:'BIND',actions:['bind.prepare','carrier.event','policy.active','application.declined','application.failed','policy.cancelled'],terminalActions:['policy.active','application.declined','application.failed','policy.cancelled']},
  {id:'policy_lifecycle',version:1,owner:'POLICY',actions:['policy.status.read','policy.document.read','policy.timeline.read'],terminalActions:[]},
  {id:'renewal_reshop',version:1,owner:'RENEW',actions:['renewal.detect','renewal.reshop','renewal.decide'],terminalActions:['renewal.decide']},
  {id:'value_evidence',version:1,owner:'SAVE',actions:['value.baseline','value.projected','value.realized','value.milestone'],terminalActions:[]},
  {id:'insurance_notifications',version:1,owner:'SIGNAL',actions:['notification.generate','notification.read','notification.dismiss'],terminalActions:[]}
];

export function insuranceWorkflowFor(action:string){
  return insuranceWorkflowRegistry.find(item=>item.actions.includes(action))||insuranceWorkflowRegistry[0];
}
