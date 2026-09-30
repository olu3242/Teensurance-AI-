import {createHash} from 'node:crypto';
import type {SavingsFacts,SavingsOpportunity} from './types';

const idFor=(householdId:string,category:string)=>
  createHash('sha256').update(`${householdId}:${category}`).digest('hex').slice(0,20);

function daysUntil(date:string,now:string){
  const delta=new Date(date).getTime()-new Date(now).getTime();
  return Math.ceil(delta/86_400_000);
}

export function detectSavingsOpportunities(facts:SavingsFacts):SavingsOpportunity[]{
  const now=facts.now;
  const items:SavingsOpportunity[]=[];
  const add=(input:Omit<SavingsOpportunity,'id'|'householdId'|'createdAt'|'updatedAt'>)=>{
    items.push({...input,id:idFor(facts.householdId,input.category),householdId:facts.householdId,createdAt:now,updatedAt:now});
  };

  if(!facts.policy){
    add({
      category:'reshop',status:'evidence_needed',
      reason:'A comparable current-policy baseline is required before Teensurance can measure or verify savings.',
      evidenceRequired:['current_policy_baseline'],evidencePresent:[],
      nextAction:'Capture the current premium, coverages, deductible, vehicles, drivers and renewal date.',
      confidence:'verified',source:'household'
    });
    return items;
  }

  if(facts.driverEducationVerified&&!facts.policy.currentDiscounts.includes('driver_education')){
    add({
      category:'driver_education',status:'comparison_ready',
      reason:'Verified driver-education evidence exists, but the policy baseline does not show a matching discount.',
      evidenceRequired:['driver_education_completion'],evidencePresent:['driver_education_completion'],
      nextAction:'Check participating carrier programs or the current carrier for an applicable driver-education discount.',
      confidence:'authoritative_rule',source:'household'
    });
  }

  if(facts.goodStudentEvidenceVerified&&!facts.policy.currentDiscounts.includes('good_student')){
    add({
      category:'good_student',status:'comparison_ready',
      reason:'Verified good-student evidence exists, but the policy baseline does not show a matching discount.',
      evidenceRequired:['good_student_evidence'],evidencePresent:['good_student_evidence'],
      nextAction:'Check participating carrier programs for documented good-student discount availability.',
      confidence:'authoritative_rule',source:'household'
    });
  }

  if(facts.collegeAwayFromHome&&!facts.policy.currentDiscounts.includes('student_away')){
    add({
      category:'student_away',status:'comparison_ready',
      reason:'The household reports a college-away status that may be relevant to some carrier programs.',
      evidenceRequired:['student_away_evidence'],evidencePresent:[],
      nextAction:'Collect required evidence and compare participating student-away programs.',
      confidence:'unknown',source:'household'
    });
  }

  if(typeof facts.annualMileage==='number'){
    add({
      category:'low_mileage',status:'detected',
      reason:'Annual mileage is available for comparison against usage- or mileage-based products.',
      evidenceRequired:['annual_mileage'],evidencePresent:['annual_mileage'],
      nextAction:'Compare low-mileage programs without assuming eligibility or savings.',
      confidence:'unknown',source:'household'
    });
  }

  if(facts.telematicsOptIn===true){
    add({
      category:'telematics',status:'comparison_ready',
      reason:'The parent has opted in to explore telematics-based insurance programs.',
      evidenceRequired:['parent_telematics_consent'],evidencePresent:['parent_telematics_consent'],
      nextAction:'Compare participating telematics programs and their data-use terms.',
      confidence:'unknown',source:'household'
    });
  }

  if(facts.householdVehicleCount>1&&facts.vehicleAssignmentKnown){
    add({
      category:'vehicle_assignment',status:'detected',
      reason:'Multiple household vehicles are available for a policy configuration comparison.',
      evidenceRequired:['vehicle_inventory','driver_vehicle_assignment'],evidencePresent:['vehicle_inventory','driver_vehicle_assignment'],
      nextAction:'Request carrier-backed scenarios for equivalent coverage across eligible vehicle assignments.',
      confidence:'unknown',source:'household'
    });
  }

  if(facts.householdVehicleCount>1){
    add({
      category:'multi_vehicle',status:'detected',
      reason:'The household has multiple vehicles, which can be checked against carrier multi-vehicle programs.',
      evidenceRequired:['vehicle_inventory'],evidencePresent:['vehicle_inventory'],
      nextAction:'Compare participating multi-vehicle program availability.',
      confidence:'unknown',source:'household'
    });
  }

  if(facts.homePolicyKnown){
    add({
      category:'bundle',status:'detected',
      reason:'A household property policy is known and can be checked for bundle opportunities.',
      evidenceRequired:['property_policy_summary'],evidencePresent:['property_policy_summary'],
      nextAction:'Compare bundle options using equivalent auto coverage.',
      confidence:'unknown',source:'household'
    });
  }

  if(facts.policy.renewalDate){
    const days=daysUntil(facts.policy.renewalDate,now);
    if(days>=0&&days<=60){
      add({
        category:'reshop',status:'comparison_ready',
        reason:`The current policy renews in ${days} day${days===1?'':'s'}, creating a natural comparison window.`,
        evidenceRequired:['current_policy_baseline'],evidencePresent:['current_policy_baseline'],
        nextAction:'Compare equivalent-coverage marketplace quotes before renewal.',
        confidence:'verified',source:'household'
      });
    }
  }

  return items;
}
