import {randomUUID} from 'node:crypto';
import {all,put} from '@/lib/platform/db';
import {dashboard} from '@/lib/platform/service';
import {AppError} from '@/lib/platform/auth';
import type {Evidence,User} from '@/lib/platform/types';
import {reviewFirstPolicyExtractor} from './policy-document';
import {nhtsaVpicDecoder,type VehicleProfile} from './vehicle';
import {buildSavingsPassport} from './passport';
import type {PolicyBaseline,SavingsOpportunity} from './types';

async function guardian(user:User,householdId:string){
 const d=await dashboard(user,householdId);if(d.membership?.role!=='guardian')throw new AppError('A guardian must manage SAVE integrations.',403);return d;
}

export async function extractPolicyDocument(user:User,householdId:string,text:string,mimeType:string){
 await guardian(user,householdId);
 const extraction=await reviewFirstPolicyExtractor.extract({text,mimeType});
 const record={id:randomUUID(),householdId,ownerId:user.id,extraction,status:'REQUIRES_REVIEW' as const,createdAt:new Date().toISOString()};
 await put('save_policy_extraction',record);return record;
}

export async function decodeAndSaveVehicle(user:User,householdId:string,vin:string,modelYear?:number){
 await guardian(user,householdId);
 const vehicle=await nhtsaVpicDecoder.decode(vin,modelYear);
 const record={...vehicle,id:randomUUID(),householdId,ownerId:user.id};
 await put('save_vehicle',record);return record;
}

export async function savingsPassport(user:User,householdId:string,input:{annualMileage?:number;telematicsConsent?:boolean}={}){
 const d=await guardian(user,householdId);
 const [baselines,vehicles,opportunities]=await Promise.all([
  all<(PolicyBaseline&{id:string;ownerId:string})>('save_policy_baseline',householdId),
  all<(VehicleProfile&{id:string;householdId:string;ownerId:string})>('save_vehicle',householdId),
  all<(SavingsOpportunity&{ownerId:string})>('save_opportunity',householdId)
 ]);
 return buildSavingsPassport({evidence:d.evidence as Evidence[],baseline:baselines[0],vehicles,opportunities,annualMileage:input.annualMileage,telematicsConsent:input.telematicsConsent});
}
