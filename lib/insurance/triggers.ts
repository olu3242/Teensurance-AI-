import type {InsuranceAgentId} from './agents';
import type {InsuranceWorkflowId} from './workflows';

export type InsuranceTriggerPriority='P0'|'P1'|'P2'|'P3'|'P4'|'P5'|'P6'|'P7'|'P8'|'P9';
export type InsuranceTrigger={
  id:string;
  priority:InsuranceTriggerPriority;
  source:'user'|'domain'|'state'|'time'|'carrier'|'safety';
  workflow:InsuranceWorkflowId;
  agent:InsuranceAgentId;
  action:string;
};

export const insuranceTriggerRegistry:InsuranceTrigger[]=[
  {id:'insurance.guardian.required',priority:'P0',source:'safety',workflow:'insurance_acquisition',agent:'GUARD',action:'guardian.missing'},
  {id:'insurance.quote.requested',priority:'P3',source:'user',workflow:'quote_marketplace',agent:'QUOTE',action:'quote.request'},
  {id:'insurance.offers.ready',priority:'P4',source:'domain',workflow:'quote_marketplace',agent:'MATCH',action:'quote.compare'},
  {id:'insurance.offer.selected',priority:'P2',source:'user',workflow:'quote_marketplace',agent:'MATCH',action:'offer.select'},
  {id:'insurance.bind.requested',priority:'P1',source:'user',workflow:'carrier_bind',agent:'BIND',action:'bind.prepare'},
  {id:'insurance.carrier.event',priority:'P0',source:'carrier',workflow:'carrier_bind',agent:'GUARD',action:'carrier.event'},
  {id:'insurance.policy.activated',priority:'P2',source:'carrier',workflow:'policy_lifecycle',agent:'POLICY',action:'policy.active'},
  {id:'insurance.renewal.window',priority:'P3',source:'time',workflow:'renewal_reshop',agent:'RENEW',action:'renewal.detect'},
  {id:'insurance.nonrenewal.reported',priority:'P1',source:'carrier',workflow:'renewal_reshop',agent:'RENEW',action:'renewal.nonrenewal'},
  {id:'insurance.policy.status',priority:'P5',source:'user',workflow:'policy_lifecycle',agent:'POLICY',action:'policy.status.read'},
  {id:'insurance.value.baseline',priority:'P4',source:'user',workflow:'value_evidence',agent:'SAVE',action:'value.baseline'},
  {id:'insurance.value.projected',priority:'P5',source:'domain',workflow:'value_evidence',agent:'SAVE',action:'value.projected'},
  {id:'insurance.value.evidence',priority:'P5',source:'domain',workflow:'value_evidence',agent:'SAVE',action:'value.realized'},
  {id:'insurance.renewal.reshop',priority:'P3',source:'user',workflow:'renewal_reshop',agent:'RENEW',action:'renewal.reshop'},
  {id:'insurance.renewal.decide',priority:'P2',source:'user',workflow:'renewal_reshop',agent:'RENEW',action:'renewal.decide'},
  {id:'insurance.notification.requested',priority:'P6',source:'domain',workflow:'insurance_notifications',agent:'SIGNAL',action:'notification.generate'},
  {id:'insurance.notification.read',priority:'P7',source:'user',workflow:'insurance_notifications',agent:'SIGNAL',action:'notification.read'},
  {id:'insurance.notification.dismiss',priority:'P7',source:'user',workflow:'insurance_notifications',agent:'SIGNAL',action:'notification.dismiss'}
];

export function insuranceTriggerFor(action:string){
  return insuranceTriggerRegistry.find(item=>item.action===action)||
    {id:'insurance.default',priority:'P9',source:'domain' as const,workflow:'insurance_acquisition' as const,agent:'T' as const,action};
}
