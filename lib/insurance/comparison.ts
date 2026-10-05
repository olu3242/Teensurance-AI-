import {randomUUID} from 'node:crypto';
import {all,put,transaction} from '../platform/db';
import {AppError} from '../platform/auth';
import {audit} from '../platform/service';
import type {Member,User} from '../platform/types';
import type {CarrierQuote,QuoteSession} from './types';

export type ComparableOffer={
  carrierId:string;
  carrierDisplayName:string;
  quoteId:string;
  monthlyPremiumCents:number;
  sixMonthPremiumCents:number;
  deductibleCents:number;
  coverageLevel:CarrierQuote['coverageLevel'];
  bindable:boolean;
  synthetic:boolean;
  expiresAt:string;
  disclosures:string[];
};

export type OfferComparison={
  sessionId:string;
  householdId:string;
  teenId:string;
  sort:'monthly_premium_ascending';
  offers:ComparableOffer[];
  unavailable:{carrierId:string;status:'declined'|'unavailable';reason:string}[];
  disclaimer:string;
};

export type OfferSelection={
  id:string;
  householdId:string;
  ownerId:string;
  teenId:string;
  sessionId:string;
  carrierId:string;
  quoteId:string;
  selectedAt:string;
  disclosureAcknowledgedAt:string;
  status:'selected'|'sandbox_selected';
  bindHandoff:{
    allowed:boolean;
    reason:string;
  };
};

async function guardianMembership(user:User,householdId:string){
  const member=(await all<Member>('member',householdId))
    .find(item=>item.ownerId===user.id&&item.active);
  if(!member||member.role!=='guardian')throw new AppError('Guardian insurance access required.',403);
}

async function ownedSession(user:User,householdId:string,sessionId:string){
  await guardianMembership(user,householdId);
  const session=(await all<QuoteSession>('insurance_quote_session',householdId))
    .find(item=>item.id===sessionId&&item.ownerId===user.id);
  if(!session)throw new AppError('Quote session not found.',404);
  return session;
}

export async function compareOffers(user:User,householdId:string,sessionId:string):Promise<OfferComparison>{
  const session=await ownedSession(user,householdId,sessionId);
  const nowMs=Date.now();
  const offers=session.results
    .filter((result):result is Extract<typeof result,{status:'quoted'}>=>result.status==='quoted')
    .map(result=>result.quote)
    .filter(quote=>Date.parse(quote.expiresAt)>nowMs)
    .sort((a,b)=>a.monthlyPremiumCents-b.monthlyPremiumCents||a.carrierDisplayName.localeCompare(b.carrierDisplayName))
    .map(quote=>({...quote}));
  const unavailable=session.results
    .filter((result):result is Extract<typeof result,{status:'declined'|'unavailable'}>=>result.status!=='quoted')
    .map(result=>({carrierId:result.carrierId,status:result.status,reason:result.reason}));
  return {
    sessionId:session.id,
    householdId:session.householdId,
    teenId:session.teenId,
    sort:'monthly_premium_ascending',
    offers,
    unavailable,
    disclaimer:'Offers are displayed using a neutral price sort. Order is not a recommendation. Coverage terms, exclusions, eligibility, discounts, and final pricing must be confirmed by the carrier.'
  };
}

export async function selectOffer(
  user:User,
  householdId:string,
  sessionId:string,
  quoteId:string,
  disclosuresAcknowledged:boolean
):Promise<OfferSelection>{
  if(!disclosuresAcknowledged)throw new AppError('Review and acknowledge the offer disclosures before selecting.',400);
  return transaction(async()=>{
    const session=await ownedSession(user,householdId,sessionId);
    const result=session.results.find(item=>item.status==='quoted'&&item.quote.quoteId===quoteId);
    if(!result||result.status!=='quoted')throw new AppError('Quoted offer not found.',404);
    if(Date.parse(result.quote.expiresAt)<=Date.now())throw new AppError('This quote has expired. Request a new comparison.',409);

    const prior=(await all<OfferSelection>('insurance_offer_selection',householdId))
      .find(item=>item.sessionId===sessionId&&item.ownerId===user.id);
    if(prior){
      if(prior.quoteId===quoteId)return prior;
      throw new AppError('An offer has already been selected for this quote session.',409);
    }

    const selectedAt=new Date().toISOString();
    const selection:OfferSelection={
      id:randomUUID(),
      householdId,
      ownerId:user.id,
      teenId:session.teenId,
      sessionId,
      carrierId:result.quote.carrierId,
      quoteId:result.quote.quoteId,
      selectedAt,
      disclosureAcknowledgedAt:selectedAt,
      status:result.quote.synthetic?'sandbox_selected':'selected',
      bindHandoff:result.quote.bindable
        ?{allowed:true,reason:'Carrier adapter marked this offer eligible for a carrier-controlled bind handoff.'}
        :{allowed:false,reason:'This offer is not bindable. Sandbox quotes cannot start coverage.'}
    };
    await put('insurance_offer_selection',selection);
    await audit(user.id,householdId,'insurance.offer.select','ALLOW',
      result.quote.bindable?'Guardian selected a carrier offer for bind handoff.':'Guardian selected a sandbox offer; binding remains blocked.');
    return selection;
  });
}
