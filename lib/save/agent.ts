import type {SavingsDecision,SavingsFacts,SavingsOpportunity} from './types';
import {detectSavingsOpportunities} from './rules';

const priority:Record<SavingsOpportunity['category'],number>={
  reshop:10,
  driver_education:20,
  good_student:30,
  student_away:40,
  vehicle_assignment:50,
  low_mileage:60,
  telematics:70,
  multi_vehicle:80,
  bundle:90,
  deductible:100
};

export const saveAgentContract={
  agent_id:'SAVE',
  name:'SAVE',
  purpose:'Parent-facing insurance cost strategy and next-best-savings-action orchestration.',
  objective:'Identify evidence-backed opportunities to reduce household insurance cost without inventing eligibility, premium amounts, or underwriting outcomes.',
  eligible_roles:['guardian'],
  activation_conditions:['Authenticated guardian','Vehicle parked','Guardian consent available'],
  required_inputs:['household savings facts','current policy baseline when available'],
  authoritative_sources:['Carrier data','Regulator sources','Verified household evidence','Comparable quotes'],
  available_tools:['policy-baseline','savings-rules','quote-orchestrator','vehicle-intelligence','evidence-service'],
  allowed_actions:['Detect savings opportunities','Prioritize next action','Prepare comparison request','Explain evidence gaps'],
  prohibited_actions:['Bind insurance','Cancel coverage','Reduce coverage automatically','Invent discounts','Invent premiums','Create a risk score'],
  parent_permission_requirements:['Sharing data with quote providers','Telematics enrollment','Submitting evidence','Any policy change'],
  handoff_targets:['COVER','STACKS','PERKS','RYDES','licensed_insurance_professional'],
  safety_classification:'PARKED_ONLY'
} as const;

function decisionFor(opportunity:SavingsOpportunity):SavingsDecision{
  switch(opportunity.category){
    case 'driver_education':
      return {action:'compare_marketplace_quotes',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'PERKS'};
    case 'good_student':
      return {action:'compare_marketplace_quotes',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'PERKS'};
    case 'student_away':
      return {action:'review_student_away_programs',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'PERKS'};
    case 'vehicle_assignment':
      return {action:'compare_vehicle_assignment',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'RYDES'};
    case 'low_mileage':
      return {action:'compare_low_mileage_programs',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'STACKS'};
    case 'telematics':
      return {action:'compare_telematics_programs',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'STACKS'};
    case 'bundle':
      return {action:'compare_bundle_options',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'COVER'};
    case 'multi_vehicle':
      return {action:'compare_marketplace_quotes',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'COVER'};
    case 'reshop':
      return opportunity.status==='evidence_needed'
        ? {action:'collect_policy_baseline',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:false,handoff:'COVER'}
        : {action:'review_renewal',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'COVER'};
    case 'deductible':
      return {action:'compare_marketplace_quotes',reason:opportunity.reason,opportunityId:opportunity.id,requiresParent:true,requiresConsent:true,handoff:'COVER'};
  }
}

export function getNextBestSavingsAction(facts:SavingsFacts):{
  opportunities:SavingsOpportunity[];
  decision:SavingsDecision;
}{
  const opportunities=detectSavingsOpportunities(facts)
    .sort((a,b)=>priority[a.category]-priority[b.category]);

  const top=opportunities[0];
  if(!top){
    return {
      opportunities,
      decision:{
        action:'compare_marketplace_quotes',
        reason:'No evidence-backed savings trigger is active. SAVE will wait for a household, policy, milestone or renewal change before proposing an action.',
        requiresParent:true,
        requiresConsent:true,
        handoff:'COVER'
      }
    };
  }
  return {opportunities,decision:decisionFor(top)};
}
