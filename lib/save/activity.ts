import {randomUUID} from 'node:crypto';
import {all,put} from '@/lib/platform/db';
import type {User} from '@/lib/platform/types';
import {requireSaveGuardian} from './authorization';

export type SaveActivityType='consent'|'quote_requested'|'quote_received'|'cover_handoff'|'decision'|'verified_savings';
export type SaveActivity={
 id:string;householdId:string;ownerId:string;type:SaveActivityType;
 summary:string;metadata?:Record<string,string|number|boolean>;at:string;
};

export async function recordSaveActivity(user:User,householdId:string,type:SaveActivityType,summary:string,metadata?:SaveActivity['metadata']){
 await requireSaveGuardian(user,householdId);
 const item:SaveActivity={id:randomUUID(),householdId,ownerId:user.id,type,summary,metadata,at:new Date().toISOString()};
 await put('save_activity',item);return item;
}

export async function saveActivityHistory(user:User,householdId:string){
 await requireSaveGuardian(user,householdId);
 return (await all<SaveActivity>('save_activity',householdId)).sort((a,b)=>b.at.localeCompare(a.at));
}
