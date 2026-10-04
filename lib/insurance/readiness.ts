import {all,put,transaction} from '../platform/db';
import {AppError} from '../platform/auth';
import {audit} from '../platform/service';
import {normalizeJurisdiction,ruleForJurisdiction} from '../platform/jurisdictions';
import type {Member,Profile,Relationship,User} from '../platform/types';
import {z} from 'zod';

export const insuranceReadinessStatuses=['NOT_READY','PREPARING','SHOPPING_SOON','QUOTE_READY','COVERED'] as const;
export type InsuranceReadinessStatus=typeof insuranceReadinessStatuses[number];
export type CoverageStatus='unknown'|'not_covered'|'covered';

export type InsuranceReadinessContext={
  id:string;
  householdId:string;
  ownerId:string;
  teenId:string;
  jurisdiction:string;
  coverageStatus:CoverageStatus;
  coverageNeededBy?:string;
  updatedAt:string;
};

export type InsuranceReadiness={
  status:InsuranceReadinessStatus;
  householdId:string;
  teenId:string;
  jurisdiction:string;
  profileStage:Profile['stage'];
  coverageStatus:CoverageStatus;
  coverageNeededBy?:string;
  reasons:string[];
  blockers:string[];
  derivedAt:string;
  version:'insurance-readiness-v1';
  disclaimer:string;
};

const contextSchema=z.object({
  householdId:z.string().uuid(),
  teenId:z.string().uuid(),
  jurisdiction:z.string().trim().min(2).max(8),
  coverageStatus:z.enum(['unknown','not_covered','covered']),
  coverageNeededBy:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

async function guardianScope(user:User,householdId:string,teenId:string){
  const member=(await all<Member>('member',householdId)).find(m=>m.ownerId===user.id&&m.active);
  if(member?.role!=='guardian')throw new AppError('A linked guardian must manage insurance readiness.',403);
  const linked=(await all<Relationship>('relationship',householdId)).some(r=>r.active&&r.kind==='guardian'&&r.adultId===user.id&&r.teenId===teenId);
  if(!linked)throw new AppError('Guardian relationship to this driver is required.',403);
  const profile=(await all<Profile>('profile',householdId)).find(p=>p.ownerId===teenId);
  if(!profile)throw new AppError('Complete the driver profile first.',409);
  return profile;
}

function daysUntil(date:string,now:Date){
  const target=Date.parse(date+'T00:00:00Z');
  if(Number.isNaN(target))return undefined;
  return Math.ceil((target-now.getTime())/86400000);
}

export function deriveInsuranceReadiness(profile:Profile,context:InsuranceReadinessContext|undefined,now=new Date()):InsuranceReadiness{
  const jurisdiction=normalizeJurisdiction(profile.jurisdiction);
  const blockers:string[]=[];
  const reasons:string[]=[];
  const currentRule=ruleForJurisdiction(jurisdiction,undefined,now);

  if(!currentRule)blockers.push('CURRENT_JURISDICTION_RULE_REQUIRED');
  if(!context)blockers.push('INSURANCE_CONTEXT_REQUIRED');
  if(context&&normalizeJurisdiction(context.jurisdiction)!==jurisdiction)blockers.push('JURISDICTION_MISMATCH');

  const coverageStatus=context?.coverageStatus||'unknown';
  const coverageNeededBy=context?.coverageNeededBy;

  let status:InsuranceReadinessStatus='NOT_READY';

  if(blockers.length===0){
    if(coverageStatus==='covered'){
      status='COVERED';
      reasons.push('Guardian reports that the teen is currently covered.');
    }else if(profile.stage==='licensed'){
      status='QUOTE_READY';
      reasons.push('The driver profile is licensed and no active coverage is recorded.');
    }else{
      const days=coverageNeededBy?daysUntil(coverageNeededBy,now):undefined;
      if(days!==undefined&&days<=45){
        status='SHOPPING_SOON';
        reasons.push(days<0?'The recorded coverage-needed date has passed.':`Coverage is recorded as needed within ${days} days.`);
      }else if(profile.stage==='permit'){
        status='PREPARING';
        reasons.push('The driver is in the permit stage; insurance preparation can begin before licensing.');
      }else if(coverageNeededBy){
        status='PREPARING';
        reasons.push('A future coverage-needed date is recorded.');
      }else{
        status='NOT_READY';
        blockers.push('COVERAGE_TIMING_REQUIRED');
      }
    }
  }

  return {
    status,
    householdId:context?.householdId||profile.householdId,
    teenId:profile.ownerId,
    jurisdiction,
    profileStage:profile.stage,
    coverageStatus,
    coverageNeededBy,
    reasons,
    blockers,
    derivedAt:now.toISOString(),
    version:'insurance-readiness-v1',
    disclaimer:'Insurance readiness is a shopping-workflow state only. It is not legal eligibility, underwriting, a risk score, a quote, or a promise of coverage.',
  };
}

export async function saveInsuranceReadinessContext(user:User,raw:unknown){
  const parsed=contextSchema.safeParse(raw);
  if(!parsed.success)throw new AppError('Invalid insurance readiness request.',400);
  const input=parsed.data;
  return transaction(async()=>{
    try{
      const profile=await guardianScope(user,input.householdId,input.teenId);
      const requested=normalizeJurisdiction(input.jurisdiction);
      const profileJurisdiction=normalizeJurisdiction(profile.jurisdiction);
      if(requested!==profileJurisdiction)throw new AppError('Insurance state must match the driver profile.',409);
      if(input.coverageNeededBy){
        const parsedDate=Date.parse(input.coverageNeededBy+'T00:00:00Z');
        if(Number.isNaN(parsedDate))throw new AppError('Coverage-needed date is invalid.',400);
      }
      const context:InsuranceReadinessContext={
        id:`insurance-readiness:${input.householdId}:${input.teenId}`,
        householdId:input.householdId,
        ownerId:user.id,
        teenId:input.teenId,
        jurisdiction:requested,
        coverageStatus:input.coverageStatus,
        coverageNeededBy:input.coverageNeededBy,
        updatedAt:new Date().toISOString(),
      };
      await put('insurance_readiness_context',context);
      const readiness=deriveInsuranceReadiness(profile,context);
      await audit(user.id,input.householdId,'insurance.readiness.update','ALLOW','Guardian updated factual insurance timing context; readiness was derived without risk scoring.');
      return {status:200,result:{context,readiness}};
    }catch(error){
      if(error instanceof AppError)await audit(user.id,input.householdId,'insurance.readiness.update','DENY',error.message);
      throw error;
    }
  });
}

export async function readInsuranceReadiness(user:User,householdId:string,teenId:string){
  const profile=await guardianScope(user,householdId,teenId);
  const context=(await all<InsuranceReadinessContext>('insurance_readiness_context',householdId)).find(x=>x.teenId===teenId);
  return {status:200,result:deriveInsuranceReadiness(profile,context)};
}
