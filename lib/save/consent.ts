import {randomUUID} from 'node:crypto';
import {all,put} from '@/lib/platform/db';
import type {User} from '@/lib/platform/types';
import {requireSaveGuardian} from './authorization';

export type SaveConsentType='marketplace'|'telematics'|'document_processing';
export type SaveConsentRecord={
 id:string;householdId:string;ownerId:string;type:SaveConsentType;
 granted:boolean;version:string;recordedAt:string;revokedAt?:string;
};

export async function setSaveConsent(user:User,householdId:string,type:SaveConsentType,granted:boolean,version='save-consent-v1'){
 await requireSaveGuardian(user,householdId);
 const prior=(await all<SaveConsentRecord>('save_consent',householdId)).find(x=>x.ownerId===user.id&&x.type===type);
 const now=new Date().toISOString();
 const record:SaveConsentRecord={
  id:prior?.id||randomUUID(),householdId,ownerId:user.id,type,granted,version,
  recordedAt:now,...(!granted?{revokedAt:now}:{})
 };
 await put('save_consent',record);return record;
}

export async function getSaveConsents(user:User,householdId:string){
 await requireSaveGuardian(user,householdId);
 const records=await all<SaveConsentRecord>('save_consent',householdId);
 const latest=(type:SaveConsentType)=>records.filter(x=>x.ownerId===user.id&&x.type===type).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt))[0];
 return {marketplace:latest('marketplace'),telematics:latest('telematics'),documentProcessing:latest('document_processing')};
}
