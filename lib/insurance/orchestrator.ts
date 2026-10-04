import type {User} from '../platform/types';
import {routeInsuranceCommand,type InsuranceRuntimeCommand} from './runtime';
import {createQuoteSession} from './service';
import {compareOffers,selectOffer} from './comparison';
import {startBindHandoff} from './bind';
import {recordCurrentPolicyBaseline,projectedSavings,realizedSavings} from './value';
import {renewalOpportunities,startRenewalReshop,recordRenewalDecision} from './renewal';
import {generateInsuranceNotifications} from './notifications';
import type {QuoteInput} from './types';

type InsurancePayload=Record<string,unknown>;

export async function orchestrateInsurance(user:User,command:InsuranceRuntimeCommand,payload:InsurancePayload){
  const trace=await routeInsuranceCommand(user,command);

  if(command.action==='quote.request')return {trace,result:await createQuoteSession(user,payload as unknown as QuoteInput,String(payload.idempotencyKey||''))};
  if(command.action==='quote.compare')return {trace,result:await compareOffers(user,command.householdId,String(payload.sessionId||''))};
  if(command.action==='offer.select')return {trace,result:await selectOffer(user,command.householdId,String(payload.sessionId||''),String(payload.quoteId||''),Boolean(payload.disclosuresAcknowledged))};
  if(command.action==='bind.prepare')return {trace,result:await startBindHandoff(user,command.householdId,String(payload.selectionId||''))};
  if(command.action==='value.baseline')return {trace,result:await recordCurrentPolicyBaseline(user,command.householdId,String(payload.teenId||''),Number(payload.amountCents),payload.period as 'monthly'|'six_month',String(payload.referenceId||''))};
  if(command.action==='value.projected')return {trace,result:await projectedSavings(user,command.householdId,String(payload.teenId||''),String(payload.quoteSessionId||''),String(payload.quoteId||''))};
  if(command.action==='value.realized')return {trace,result:await realizedSavings(user,command.householdId,String(payload.policyId||''))};
  if(command.action==='renewal.detect')return {trace,result:await renewalOpportunities(user,command.householdId)};
  if(command.action==='renewal.reshop')return {trace,result:await startRenewalReshop(user,command.householdId,String(payload.policyId||''),String(payload.idempotencyKey||''))};
  if(command.action==='renewal.decide')return {trace,result:await recordRenewalDecision(user,command.householdId,String(payload.policyId||''),String(payload.quoteSessionId||''),payload.decision as 'stay'|'switch',payload.selectedCarrierId as string|undefined,payload.selectedQuoteId as string|undefined)};
  if(command.action==='notification.generate')return {trace,result:await generateInsuranceNotifications(user,command.householdId)};
  return {trace,result:null};
}
