export type InsuranceAgentId='T'|'GUARD'|'COVER'|'QUOTE'|'MATCH'|'BIND'|'POLICY'|'SAVE'|'RENEW'|'SIGNAL';

export type InsuranceAgentContract={
  id:InsuranceAgentId;
  name:string;
  purpose:string;
  allowedActions:string[];
  humanApprovalRequired:string[];
  prohibitedActions:string[];
};

export const insuranceAgentRegistry:InsuranceAgentContract[]=[
  {id:'T',name:'T',purpose:'Single user-facing insurance journey assistant.',allowedActions:['explain','route'],humanApprovalRequired:[],prohibitedActions:['quote','select_offer','bind','activate_policy']},
  {id:'GUARD',name:'GUARD',purpose:'Deterministic insurance policy and safety kernel.',allowedActions:['authorize','deny','defer','require_guardian','require_carrier'],humanApprovalRequired:[],prohibitedActions:['mutate_policy','invent_carrier_status']},
  {id:'COVER',name:'COVER',purpose:'Guardian insurance preparation and education.',allowedActions:['prepare','explain_coverage','collect_context'],humanApprovalRequired:['guardian insurance submission'],prohibitedActions:['bind','activate_policy']},
  {id:'QUOTE',name:'QUOTE',purpose:'Normalize quote requests and coordinate carrier adapters.',allowedActions:['create_quote_session','normalize_request'],humanApprovalRequired:['guardian quote submission'],prohibitedActions:['recommend_best','bind','activate_policy']},
  {id:'MATCH',name:'MATCH',purpose:'Normalize and compare carrier offers without ranking by recommendation.',allowedActions:['compare_offers','sort_neutral'],humanApprovalRequired:['guardian offer selection'],prohibitedActions:['auto_select','label_best']},
  {id:'BIND',name:'BIND',purpose:'Prepare carrier-controlled bind handoffs.',allowedActions:['prepare_handoff','track_handoff'],humanApprovalRequired:['guardian offer selection','guardian disclosure acknowledgement'],prohibitedActions:['activate_policy','forge_carrier_event']},
  {id:'POLICY',name:'POLICY',purpose:'Project carrier-confirmed policy lifecycle state.',allowedActions:['project_status','project_documents','project_timeline'],humanApprovalRequired:[],prohibitedActions:['create_coverage','renew_coverage','cancel_coverage']},
  {id:'SAVE',name:'SAVE',purpose:'Calculate projected and realized insurance value from evidence.',allowedActions:['project_savings','realize_savings','record_milestone'],humanApprovalRequired:['guardian baseline submission'],prohibitedActions:['claim_causation','invent_discount']},
  {id:'RENEW',name:'RENEW',purpose:'Coordinate renewal and re-shopping workflows.',allowedActions:['detect_window','prefill_reshop','record_stay_switch'],humanApprovalRequired:['guardian stay/switch decision'],prohibitedActions:['auto_switch','auto_renew']},
  {id:'SIGNAL',name:'SIGNAL',purpose:'Generate deduplicated actionable insurance notifications.',allowedActions:['generate_notification','dedupe','prioritize'],humanApprovalRequired:[],prohibitedActions:['spam','imply_coverage']},
];

export function insuranceAgentFor(id:InsuranceAgentId){
  const agent=insuranceAgentRegistry.find(item=>item.id===id);
  if(!agent)throw new Error('Unknown insurance agent: '+id);
  return agent;
}
