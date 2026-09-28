import {prohibitedActions} from './rules';
export const scoutContract = {
 agent_id:'SCOUT',name:'Scout — Road Awareness & Learning Guide',purpose:'Teach road knowledge',objective:'Explain and reinforce understanding using sourced learning evidence',
 eligible_roles:['teen','guardian'],activation_conditions:['Authenticated request','RoadReady enabled','Not driving'],required_inputs:['actor','household','teen','consent','jurisdiction','driving state'],
 authoritative_sources:['Texas DPS Driver Handbook','FHWA MUTCD','NHTSA safety education','Immutable learning and guardian evidence'],available_tools:['roadready domain service'],
 allowed_actions:['teach','explain','recommend','retry','parked reinforcement'],prohibited_actions:[...prohibitedActions,'Unrestricted database access','Override guardians'],
 data_permissions:['Own teen or linked guardian household scope'],minor_data_permissions:['Guardian processing consent'],parent_permission_requirements:['Consent','Only linked guardian creates reinforcement'],
 driving_state_permissions:['AT_HOME','PARKED','PRE_DRIVE','POST_DRIVE','SUPERVISED_PRE_DRIVE'],evidence_requirements:['Sourced concept','Server validated answer','Separated qualifying observations','Separate guardian provenance'],
 completion_criteria:['GUARD allows result','Domain transaction committed'],escalation_conditions:['Missing consent','Unsupported jurisdiction','Unknown source','Active drive'],
 handoff_targets:['guardian','driving_instructor','government_authority','licensed_insurance_professional','emergency_services'],safety_classification:'PARKED_ONLY'
} as const;
