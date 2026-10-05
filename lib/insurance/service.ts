import {randomUUID} from 'node:crypto';
import {all,put,transaction} from '../platform/db';
import {AppError,hash} from '../platform/auth';
import {audit} from '../platform/service';
import {ruleForJurisdiction,normalizeJurisdiction} from '../platform/jurisdictions';
import type {Drive,Evidence,Member,Profile,Relationship,User} from '../platform/types';
import {collectCarrierQuotes,type CarrierAdapter} from './adapters';
import type {NormalizedQuoteRequest,QuoteInput,QuoteSession,QuoteVehicle} from './types';

const now=()=>new Date().toISOString();

function assertInput(input:QuoteInput){
  if(!input.householdId||!input.teenId)throw new AppError('Choose a household and teen driver.',400);
  if(!['add_teen','compare_current','new_policy'].includes(input.intent))throw new AppError('Choose a valid insurance shopping goal.',400);
  if(!['state_minimum','standard','higher_limits'].includes(input.coverageLevel))throw new AppError('Choose a valid coverage level.',400);
  if(!Array.isArray(input.vehicles)||input.vehicles.length<1||input.vehicles.length>6)throw new AppError('Add at least one vehicle.',400);
  for(const vehicle of input.vehicles)assertVehicle(vehicle);
}

function assertVehicle(vehicle:QuoteVehicle){
  const currentYear=new Date().getUTCFullYear()+1;
  if(!Number.isInteger(vehicle.year)||vehicle.year<1980||vehicle.year>currentYear)throw new AppError('Check the vehicle year.',400);
  if(!vehicle.make?.trim()||!vehicle.model?.trim())throw new AppError('Vehicle make and model are required.',400);
  if(vehicle.vin&& !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vehicle.vin))throw new AppError('VIN must contain 17 valid characters.',400);
  if(!['commute','school','pleasure','mixed'].includes(vehicle.primaryUse))throw new AppError('Choose a valid vehicle use.',400);
}

async function guardianScope(user:User,householdId:string,teenId:string){
  const members=await all<Member>('member',householdId);
  const guardian=members.find(member=>member.ownerId===user.id&&member.active&&member.role==='guardian');
  if(!guardian)throw new AppError('A guardian must submit insurance quote requests.',403);
  const teen=members.find(member=>member.ownerId===teenId&&member.active&&member.role==='teen');
  if(!teen)throw new AppError('Select an active teen driver in this household.',404);
  const linked=(await all<Relationship>('relationship',householdId))
    .some(relation=>relation.active&&relation.kind==='guardian'&&relation.adultId===user.id&&relation.teenId===teenId);
  if(!linked)throw new AppError('A linked guardian must submit this insurance request.',403);
  const profile=(await all<Profile>('profile',householdId)).find(item=>item.ownerId===teenId);
  if(!profile)throw new AppError('Complete the teen driver profile first.',409);
  return profile;
}

async function readinessSnapshot(householdId:string,teenId:string,shared:boolean){
  if(!shared)return undefined;
  const evidence=(await all<Evidence>('evidence',householdId))
    .filter(item=>item.teenId===teenId&&item.status==='accepted').length;
  const verifiedPracticeSessions=(await all<Drive>('drive',householdId))
    .filter(item=>item.teenId===teenId&&item.status==='verified').length;
  return {
    shared:true,
    acceptedMilestoneEvidence:evidence,
    verifiedPracticeSessions,
    generatedAt:now(),
    disclaimer:'Readiness evidence is separately shared context. It does not establish insurance eligibility, a premium, a discount, or an underwriting outcome.'
  };
}

export async function createQuoteSession(
  user:User,
  input:QuoteInput,
  idempotencyKey:string,
  adapters?:CarrierAdapter[]
):Promise<QuoteSession>{
  assertInput(input);
  if(!/^[a-zA-Z0-9_-]{16,100}$/.test(idempotencyKey))throw new AppError('A valid request key is required.',400);

  return transaction(async()=>{
    const profile=await guardianScope(user,input.householdId,input.teenId);
    if(!profile.consent)throw new AppError('Guardian consent for teen journey data is required before sharing profile data for quoting.',403);

    const jurisdiction=normalizeJurisdiction(profile.jurisdiction);
    const rule=ruleForJurisdiction(jurisdiction);
    if(!rule){
      await audit(user.id,input.householdId,'insurance.quote','REQUIRE_OFFICIAL_SOURCE','No currently verified jurisdiction rule is available.');
      throw new AppError('Insurance shopping is unavailable until this state package has a currently verified official-source rule.',409);
    }

    const fingerprint=hash(JSON.stringify(input));
    const previous=(await all<QuoteSession>('insurance_quote_session',input.householdId))
      .find(session=>session.ownerId===user.id&&session.idempotencyKey===idempotencyKey);
    if(previous){
      if(previous.fingerprint!==fingerprint)throw new AppError('This request key was already used for different quote data.',409);
      return previous;
    }

    const createdAt=now();
    const normalizedRequest:NormalizedQuoteRequest={
      requestId:randomUUID(),
      householdId:input.householdId,
      guardianId:user.id,
      teenId:input.teenId,
      jurisdiction,
      intent:input.intent,
      coverageLevel:input.coverageLevel,
      teen:{birthDate:profile.birthDate,stage:profile.stage},
      vehicles:input.vehicles.map(vehicle=>({...vehicle,make:vehicle.make.trim(),model:vehicle.model.trim(),vin:vehicle.vin?.toUpperCase()})),
      currentPolicy:input.currentPolicy,
      readiness:await readinessSnapshot(input.householdId,input.teenId,Boolean(input.shareReadinessEvidence)),
      regulatory:{ruleId:rule.id,ruleVersion:rule.version,sourceUrl:rule.sourceUrl,reviewedAt:rule.reviewedAt},
      createdAt
    };

    const results=await collectCarrierQuotes(normalizedRequest,adapters);
    const status=results.some(result=>result.status==='quoted')?'completed':'no_market';
    const session:QuoteSession={
      id:randomUUID(),
      householdId:input.householdId,
      ownerId:user.id,
      teenId:input.teenId,
      idempotencyKey,
      fingerprint,
      normalizedRequest,
      results,
      status,
      createdAt
    };
    await put('insurance_quote_session',session);
    await audit(user.id,input.householdId,'insurance.quote','ALLOW','Guardian-scoped normalized quote request sent only to configured carrier adapters.');
    return session;
  });
}

export async function readQuoteSessions(user:User,householdId:string){
  const members=await all<Member>('member',householdId);
  if(!members.some(member=>member.ownerId===user.id&&member.active&&member.role==='guardian'))throw new AppError('Guardian insurance access required.',403);
  return (await all<QuoteSession>('insurance_quote_session',householdId)).filter(session=>session.ownerId===user.id);
}
