import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {all,put,transaction} from '../platform/db';
import {AppError} from '../platform/auth';
import {audit} from '../platform/service';
import type {Member,Profile,Relationship,User} from '../platform/types';
import {normalizeJurisdiction} from '../platform/jurisdictions';
import {calculateInsuranceImpact} from './estimator';
import type {InsuranceImpactEstimate} from './types';

const requestSchema=z.object({
  householdId:z.string().uuid(),
  teenId:z.string().uuid(),
  jurisdiction:z.string().trim().min(2).max(8),
  currentAnnualPremium:z.number().min(0).max(100000).optional(),
}).strict();

async function guardianScope(user:User,householdId:string,teenId:string){
  const member=(await all<Member>('member',householdId)).find(m=>m.ownerId===user.id&&m.active);
  if(member?.role!=='guardian')throw new AppError('A linked guardian must request insurance estimates.',403);
  const linked=(await all<Relationship>('relationship',householdId)).some(r=>r.active&&r.kind==='guardian'&&r.adultId===user.id&&r.teenId===teenId);
  if(!linked)throw new AppError('Guardian relationship to this driver is required.',403);
  const profile=(await all<Profile>('profile',householdId)).find(p=>p.ownerId===teenId);
  if(!profile)throw new AppError('Complete the driver profile first.',409);
  return profile;
}

export async function createInsuranceImpactEstimate(user:User,raw:unknown){
  const parsed=requestSchema.safeParse(raw);
  if(!parsed.success)throw new AppError('Invalid insurance impact request.',400);
  const input=parsed.data;
  return transaction(async()=>{
    try{
      const profile=await guardianScope(user,input.householdId,input.teenId);
      const requested=normalizeJurisdiction(input.jurisdiction);
      const profileJurisdiction=normalizeJurisdiction(profile.jurisdiction);
      if(requested!==profileJurisdiction)throw new AppError('Insurance state must match the driver profile.',409);
      const result=calculateInsuranceImpact(requested,input.currentAnnualPremium);
      const estimate:InsuranceImpactEstimate={
        id:randomUUID(),
        householdId:input.householdId,
        ownerId:user.id,
        teenId:input.teenId,
        jurisdiction:requested,
        estimateType:'planning_proxy',
        currentAnnualPremium:input.currentAnnualPremium,
        estimatedIncrementLow:result.estimatedIncrementLow,
        estimatedIncrementHigh:result.estimatedIncrementHigh,
        projectedAnnualPremiumLow:result.projectedAnnualPremiumLow,
        projectedAnnualPremiumHigh:result.projectedAnnualPremiumHigh,
        basis:result.basis,
        disclaimer:'Planning estimate only. Teensurance is not an insurer and this is not a quote, underwriting decision, eligibility determination, or promise of savings.',
        createdAt:new Date().toISOString(),
      };
      await put('insurance_impact_estimate',estimate);
      await audit(user.id,input.householdId,'insurance.impact.estimate','ALLOW','Guardian requested a versioned non-binding planning estimate.');
      return {status:200,result:estimate};
    }catch(error){
      if(error instanceof AppError)await audit(user.id,input.householdId,'insurance.impact.estimate','DENY',error.message);
      throw error;
    }
  });
}

export async function latestInsuranceImpactEstimate(user:User,householdId:string,teenId:string){
  await guardianScope(user,householdId,teenId);
  const estimates=(await all<InsuranceImpactEstimate>('insurance_impact_estimate',householdId))
    .filter(e=>e.teenId===teenId)
    .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return {status:200,result:estimates[0]||null};
}
