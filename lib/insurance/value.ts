import {randomUUID} from 'node:crypto';
import {all,put,transaction} from '../platform/db';
import {AppError} from '../platform/auth';
import {audit} from '../platform/service';
import type {Member,User} from '../platform/types';
import type {PolicyRecord,BindHandoff} from './bind';
import type {QuoteSession} from './types';

export type CostEvidence={amountCents:number;period:'monthly'|'six_month';source:'guardian_current_policy'|'carrier_quote'|'carrier_active_policy';referenceId:string;recordedAt:string};
export type SavingsEvidence={id:string;householdId:string;ownerId:string;teenId:string;baseline:CostEvidence;replacement:CostEvidence;kind:'projected'|'realized';savingsCents:number;savingsPercent:number;discounts:{code:string;label:string;amountCents?:number;source:'carrier'}[];createdAt:string;disclaimer:string};

async function guardian(user:User,householdId:string){const member=(await all<Member>('member',householdId)).find(item=>item.ownerId===user.id&&item.active);if(!member||member.role!=='guardian')throw new AppError('Guardian insurance access required.',403)}
function normalize(amount:number,period:CostEvidence['period']){return period==='monthly'?amount*6:amount}
function evidenceSavings(baseline:CostEvidence,replacement:CostEvidence){const base=normalize(baseline.amountCents,baseline.period);const next=normalize(replacement.amountCents,replacement.period);const savings=base-next;return {savingsCents:savings,savingsPercent:base>0?Math.round((savings/base)*10000)/100:0}}

export async function recordCurrentPolicyBaseline(user:User,householdId:string,teenId:string,amountCents:number,period:CostEvidence['period'],referenceId:string){
 return transaction(async()=>{await guardian(user,householdId);if(!Number.isInteger(amountCents)||amountCents<=0)throw new AppError('Enter a valid current policy premium.',400);const value={id:randomUUID(),householdId,ownerId:user.id,teenId,amountCents,period,source:'guardian_current_policy' as const,referenceId,recordedAt:new Date().toISOString()};await put('insurance_cost_baseline',value);await audit(user.id,householdId,'insurance.value.baseline','ALLOW','Guardian recorded current-policy cost evidence for comparison.');return value})
}

export async function projectedSavings(user:User,householdId:string,teenId:string,quoteSessionId:string,quoteId:string):Promise<SavingsEvidence>{
 await guardian(user,householdId);
 const baseline=(await all<CostEvidence&{ownerId:string;teenId:string}>('insurance_cost_baseline',householdId)).filter(item=>item.ownerId===user.id&&item.teenId===teenId).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt))[0];
 if(!baseline)throw new AppError('Record the current policy cost before calculating projected savings.',409);
 const session=(await all<QuoteSession>('insurance_quote_session',householdId)).find(item=>item.id===quoteSessionId&&item.ownerId===user.id&&item.teenId===teenId);
 const result=session?.results.find(item=>item.status==='quoted'&&item.quote.quoteId===quoteId);
 if(!result||result.status!=='quoted')throw new AppError('Quoted offer not found.',404);
 const replacement:CostEvidence={amountCents:result.quote.sixMonthPremiumCents,period:'six_month',source:'carrier_quote',referenceId:result.quote.quoteId,recordedAt:new Date().toISOString()};
 const calc=evidenceSavings(baseline,replacement);
 const value:SavingsEvidence={id:randomUUID(),householdId,ownerId:user.id,teenId,baseline,replacement,kind:'projected',...calc,discounts:[],createdAt:new Date().toISOString(),disclaimer:'Projected savings compare supplied current-policy cost with a carrier quote. They are not realized savings and may change before binding.'};
 await put('insurance_savings_evidence',value);await audit(user.id,householdId,'insurance.value.projected','ALLOW','Recorded projected savings evidence from a carrier quote and guardian baseline.');return value;
}

export async function realizedSavings(user:User,householdId:string,policyId:string):Promise<SavingsEvidence>{
 await guardian(user,householdId);
 const policy=(await all<PolicyRecord>('insurance_policy',householdId)).find(item=>item.id===policyId&&item.ownerId===user.id&&item.status==='ACTIVE');
 if(!policy||(!policy.monthlyPremiumCents&&!policy.sixMonthPremiumCents))throw new AppError('Carrier-confirmed active-policy premium evidence is required before realized savings can be shown.',409);
 const baseline=(await all<CostEvidence&{ownerId:string;teenId:string}>('insurance_cost_baseline',householdId)).filter(item=>item.ownerId===user.id&&item.teenId===policy.teenId).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt))[0];
 if(!baseline)throw new AppError('Current-policy baseline evidence is required.',409);
 const replacement:CostEvidence=policy.sixMonthPremiumCents?{amountCents:policy.sixMonthPremiumCents,period:'six_month',source:'carrier_active_policy',referenceId:policy.externalPolicyId,recordedAt:policy.confirmedAt}:{amountCents:policy.monthlyPremiumCents!,period:'monthly',source:'carrier_active_policy',referenceId:policy.externalPolicyId,recordedAt:policy.confirmedAt};
 const handoff=(await all<BindHandoff>('insurance_bind_handoff',householdId)).find(item=>item.id===policy.handoffId);
 const events=handoff?(await all<{event:{externalReference:string;discounts?:SavingsEvidence['discounts']}}>('insurance_carrier_event',householdId)).filter(item=>item.event.externalReference===handoff.externalReference):[];
 const discounts=events.flatMap(item=>item.event.discounts||[]);
 const calc=evidenceSavings(baseline,replacement);
 const value:SavingsEvidence={id:randomUUID(),householdId,ownerId:user.id,teenId:policy.teenId,baseline,replacement,kind:'realized',...calc,discounts,createdAt:new Date().toISOString(),disclaimer:'Realized savings compare recorded baseline cost with carrier-confirmed active-policy premium evidence. They do not imply Teensurance caused the premium change.'};
 await put('insurance_savings_evidence',value);await audit(user.id,householdId,'insurance.value.realized','ALLOW','Created realized savings evidence from carrier-confirmed active-policy premium.');return value;
}
