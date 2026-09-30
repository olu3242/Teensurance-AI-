import {randomUUID} from 'node:crypto';
import {all,put} from '@/lib/platform/db';
import type {User} from '@/lib/platform/types';
import {AppError} from '@/lib/platform/auth';
import {requireSaveGuardian} from './authorization';
import type {ComparableQuote} from './service';

export type CoverHandoff={
 id:string;householdId:string;ownerId:string;quoteId:string;provider:string;
 annualPremium:number;coverageFingerprint:string;
 status:'prepared'|'sent_to_licensed_channel'|'completed'|'declined';
 createdAt:string;updatedAt:string;
 disclaimer:string;
};

export async function prepareCoverHandoff(user:User,householdId:string,quoteId:string){
 await requireSaveGuardian(user,householdId);
 const quote=(await all<ComparableQuote>('save_quote',householdId)).find(x=>x.id===quoteId);
 if(!quote)throw new AppError('Comparable quote not found.',404);
 const now=new Date().toISOString();
 const handoff:CoverHandoff={
  id:randomUUID(),householdId,ownerId:user.id,quoteId,provider:quote.provider,
  annualPremium:quote.annualPremium,coverageFingerprint:quote.coverageFingerprint,
  status:'prepared',createdAt:now,updatedAt:now,
  disclaimer:'Teensurance prepares this handoff only. Binding, cancellation, payment and final coverage decisions occur with the insurer or licensed insurance channel.'
 };
 await put('save_cover_handoff',handoff);return handoff;
}

export async function listCoverHandoffs(user:User,householdId:string){
 await requireSaveGuardian(user,householdId);
 return (await all<CoverHandoff>('save_cover_handoff',householdId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
