import {randomUUID} from 'node:crypto';
import {all,put} from '@/lib/platform/db';
import {dashboard} from '@/lib/platform/service';
import {AppError} from '@/lib/platform/auth';
import type {User} from '@/lib/platform/types';
import {getNextBestSavingsAction} from './agent';
import {calculateVerifiedSavings} from './ledger';
import type {PolicyBaseline,SavingsFacts,SavingsOpportunity,SavingsDecision} from './types';

type StoredBaseline=PolicyBaseline&{id:string;ownerId:string};
type StoredOpportunity=SavingsOpportunity&{ownerId:string};
type StoredDecision={id:string;householdId:string;ownerId:string;decision:SavingsDecision;createdAt:string};
export type ComparableQuote={
 id:string;householdId:string;ownerId:string;provider:string;annualPremium:number;
 coverageFingerprint:string;source:'carrier'|'quote';capturedAt:string;
};
export type VerifiedSavingsLedgerEntry={
 id:string;householdId:string;ownerId:string;baselineId:string;quoteId:string;
 previousAnnualPremium:number;newAnnualPremium:number;annualSavings:number;
 coverageFingerprint:string;status:'verified';verifiedAt:string;
};

async function requireGuardian(user:User,householdId:string){
 const d=await dashboard(user,householdId);
 if(d.membership?.role!=='guardian')throw new AppError('SAVE is available to a linked guardian.',403);
 return d;
}

export async function savePolicyBaseline(user:User,input:Omit<PolicyBaseline,'capturedAt'|'source'> & {source:'document'|'carrier'|'manual';capturedAt?:string}){
 await requireGuardian(user,input.householdId);
 if(typeof input.annualPremium==='number'&&input.annualPremium<0)throw new AppError('Annual premium cannot be negative.',400);
 const existing=(await all<StoredBaseline>('save_policy_baseline',input.householdId))[0];
 const record:StoredBaseline={
   ...input,
   id:existing?.id||randomUUID(),
   ownerId:user.id,
   capturedAt:input.capturedAt||new Date().toISOString()
 };
 await put('save_policy_baseline',record);
 return record;
}

export async function evaluateSavings(user:User,facts:SavingsFacts){
 await requireGuardian(user,facts.householdId);
 const result=getNextBestSavingsAction(facts);
 const now=new Date().toISOString();
 for(const item of result.opportunities){
   const prior=(await all<StoredOpportunity>('save_opportunity',facts.householdId)).find(x=>x.id===item.id);
   await put('save_opportunity',{...item,ownerId:user.id,createdAt:prior?.createdAt||item.createdAt,updatedAt:now});
 }
 const decision:StoredDecision={id:randomUUID(),householdId:facts.householdId,ownerId:user.id,decision:result.decision,createdAt:now};
 await put('save_decision',decision);
 return {...result,decisionRecordId:decision.id};
}

export async function saveComparableQuote(user:User,input:Omit<ComparableQuote,'id'|'ownerId'|'capturedAt'>){
 await requireGuardian(user,input.householdId);
 if(input.annualPremium<0)throw new AppError('Annual premium cannot be negative.',400);
 const quote:ComparableQuote={...input,id:randomUUID(),ownerId:user.id,capturedAt:new Date().toISOString()};
 await put('save_quote',quote);
 return quote;
}

export async function verifySavings(user:User,householdId:string,quoteId:string){
 await requireGuardian(user,householdId);
 const baseline=(await all<StoredBaseline>('save_policy_baseline',householdId))[0];
 const quote=(await all<ComparableQuote>('save_quote',householdId)).find(x=>x.id===quoteId);
 const verification=calculateVerifiedSavings(baseline,quote);
 if(!verification.verified)throw new AppError(verification.reason,409);
 if(!quote)throw new AppError('A carrier or quote result is required.',409);
 const annualSavings=verification.annualSavings;
 const existing=(await all<VerifiedSavingsLedgerEntry>('save_ledger',householdId)).find(x=>x.baselineId===baseline.id&&x.quoteId===quote.id);
 if(existing)return existing;
 const entry:VerifiedSavingsLedgerEntry={
   id:randomUUID(),householdId,ownerId:user.id,baselineId:baseline.id,quoteId:quote.id,
   previousAnnualPremium:verification.previousAnnualPremium,newAnnualPremium:verification.newAnnualPremium,
   annualSavings,coverageFingerprint:verification.coverageFingerprint,status:'verified',verifiedAt:new Date().toISOString()
 };
 await put('save_ledger',entry);
 return entry;
}

export async function savingsDashboard(user:User,householdId:string){
 await requireGuardian(user,householdId);
 const [baselines,opportunities,decisions,quotes,ledger]=await Promise.all([
   all<StoredBaseline>('save_policy_baseline',householdId),
   all<StoredOpportunity>('save_opportunity',householdId),
   all<StoredDecision>('save_decision',householdId),
   all<ComparableQuote>('save_quote',householdId),
   all<VerifiedSavingsLedgerEntry>('save_ledger',householdId)
 ]);
 const verifiedAnnualSavings=ledger.reduce((sum,item)=>sum+item.annualSavings,0);
 return {
   baseline:baselines[0],
   opportunities:opportunities.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),
   latestDecision:decisions.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]?.decision,
   quotes:quotes.sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt)),
   verifiedSavings:ledger.sort((a,b)=>b.verifiedAt.localeCompare(a.verifiedAt)),
   verifiedAnnualSavings,
   savingsReadiness:{
     baseline:Boolean(baselines[0]),
     coverageComparable:Boolean(baselines[0]?.coverageFingerprint),
     opportunities:opportunities.length,
     verifiedOutcomes:ledger.length
   }
 };
}
