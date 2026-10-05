import {all,put} from '../platform/db';
import {AppError} from '../platform/auth';
import type {Drive,Evidence,Member,Profile,User} from '../platform/types';
import type {ConceptMastery} from '../roadready/types';

export type InsurancePreparationState='EARLY'|'PREPARE'|'SHOP_OPTIONAL';

export type InsurancePreparationOpportunity={
  id:string;
  householdId:string;
  ownerId:string;
  teenId:string;
  state:InsurancePreparationState;
  driverStage:Profile['stage'];
  signals:{
    verifiedPracticeSessions:number;
    acceptedEvidence:number;
    demonstratedConcepts:number;
    reinforcedConcepts:number;
  };
  rationale:string;
  cta:{label:string;href:string};
  underwritingBoundary:string;
  generatedAt:string;
};

async function guardian(user:User,householdId:string){
  const member=(await all<Member>('member',householdId)).find(item=>item.ownerId===user.id&&item.active);
  if(!member||member.role!=='guardian')throw new AppError('Guardian insurance access required.',403);
}

export async function evaluateInsurancePreparation(user:User,householdId:string,teenId:string):Promise<InsurancePreparationOpportunity>{
  await guardian(user,householdId);
  const teen=(await all<Member>('member',householdId)).find(item=>item.ownerId===teenId&&item.active&&item.role==='teen');
  if(!teen)throw new AppError('Teen driver not found in this household.',404);
  const profile=(await all<Profile>('profile',householdId)).find(item=>item.ownerId===teenId);
  if(!profile)throw new AppError('Complete the teen driver profile first.',409);

  const verifiedPracticeSessions=(await all<Drive>('drive',householdId)).filter(item=>item.teenId===teenId&&item.status==='verified').length;
  const acceptedEvidence=(await all<Evidence>('evidence',householdId)).filter(item=>item.teenId===teenId&&item.status==='accepted').length;
  const mastery=(await all<ConceptMastery&{teenId:string}>('roadready_mastery',householdId)).filter(item=>item.teenId===teenId);
  const demonstratedConcepts=mastery.filter(item=>item.state==='demonstrated').length;
  const reinforcedConcepts=mastery.filter(item=>item.state==='reinforced').length;

  let state:InsurancePreparationState='EARLY';
  let rationale='Insurance shopping is available at any time. This preparation signal is advisory only.';
  if(profile.stage==='permit'&&(verifiedPracticeSessions>0||acceptedEvidence>0||demonstratedConcepts>0||reinforcedConcepts>0)){
    state='PREPARE';
    rationale='Your teen is in the permit stage and has begun building verified readiness evidence. This can be a useful time to review household coverage, vehicles, and likely teen-driver costs.';
  }
  if(profile.stage==='licensed'){
    state='SHOP_OPTIONAL';
    rationale='Your teen is licensed. You may compare household insurance options now, regardless of RoadReady or Passport completion.';
  }

  const key=`insurance-prep:${householdId}:${teenId}:${state}`;
  const existing=(await all<InsurancePreparationOpportunity>('insurance_preparation_opportunity',householdId)).find(item=>item.id===key);
  if(existing)return existing;

  const opportunity:InsurancePreparationOpportunity={
    id:key,
    householdId,
    ownerId:user.id,
    teenId,
    state,
    driverStage:profile.stage,
    signals:{verifiedPracticeSessions,acceptedEvidence,demonstratedConcepts,reinforcedConcepts},
    rationale,
    cta:{label:state==='EARLY'?'Review insurance preparation':'Prepare for teen insurance',href:'/parent/insurance?householdId='+householdId},
    underwritingBoundary:'RoadReady, Passport, practice, and learning evidence do not determine insurance eligibility, pricing, or underwriting unless a carrier explicitly requests separately consented evidence.',
    generatedAt:new Date().toISOString()
  };
  await put('insurance_preparation_opportunity',opportunity);
  return opportunity;
}
