import type {Evidence} from '@/lib/platform/types';
import type {PolicyBaseline,SavingsOpportunity} from './types';
import type {VehicleProfile} from './vehicle';

export type SavingsPassportItem={
 id:string;label:string;status:'missing'|'present'|'verified';source:string;updatedAt?:string;
};

export function buildSavingsPassport(input:{
 evidence:Evidence[];
 baseline?:PolicyBaseline;
 vehicles:VehicleProfile[];
 opportunities:SavingsOpportunity[];
 telematicsConsent?:boolean;
 annualMileage?:number;
}){
 const accepted=(milestone:string)=>input.evidence.find(e=>e.milestone===milestone&&e.status==='accepted');
 const driverEd=accepted('driver_education');
 const goodStudent=accepted('good_student');
 const studentAway=accepted('student_away');
 const items:SavingsPassportItem[]=[
  {id:'policy_baseline',label:'Current policy baseline',status:input.baseline?'verified':'missing',source:input.baseline?.source||'household',updatedAt:input.baseline?.capturedAt},
  {id:'driver_education',label:'Driver education evidence',status:driverEd?'verified':'missing',source:driverEd?.provenance||'household',updatedAt:driverEd?.reviewedAt},
  {id:'good_student',label:'Good-student evidence',status:goodStudent?'verified':'missing',source:goodStudent?.provenance||'household',updatedAt:goodStudent?.reviewedAt},
  {id:'student_away',label:'Student-away evidence',status:studentAway?'verified':'missing',source:studentAway?.provenance||'household',updatedAt:studentAway?.reviewedAt},
  {id:'vehicles',label:'Vehicle profiles',status:input.vehicles.length?'verified':'missing',source:input.vehicles.length?'NHTSA_VPIC':'household'},
  {id:'annual_mileage',label:'Annual mileage',status:typeof input.annualMileage==='number'?'present':'missing',source:'household'},
  {id:'telematics_consent',label:'Telematics preference',status:input.telematicsConsent===true?'present':'missing',source:'guardian'}
 ];
 const complete=items.filter(x=>x.status!=='missing').length;
 return {items,complete,total:items.length,percent:Math.round(complete/items.length*100),opportunityCount:input.opportunities.length,disclaimer:'Savings Passport organizes evidence and preferences. It is not an underwriting score or guarantee of a discount.'};
}
