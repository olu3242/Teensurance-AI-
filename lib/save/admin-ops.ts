import {all} from '@/lib/platform/db';
import {requireAdmin} from '@/lib/platform/admin';
import type {User} from '@/lib/platform/types';
import type {PolicyBaseline,SavingsOpportunity} from './types';
import type {ComparableQuote,VerifiedSavingsLedgerEntry} from './service';
import type {SaveConsentRecord} from './consent';
import type {CoverHandoff} from './cover-handoff';
import type {SaveActivity} from './activity';

type Stored<T>=T&{id:string;householdId:string;ownerId:string};
type SaveNotice={id:string;householdId:string;ownerId:string;kind:string;subject:string;message:string;status:string;createdAt:string};
type VehicleRecord={id:string;householdId:string;ownerId:string;vin?:string;make?:string;model?:string;modelYear?:number;vehicleType?:string};
type ExtractionRecord={id:string;householdId:string;ownerId:string;status:string;createdAt:string};
type DecisionRecord={id:string;householdId:string;ownerId:string;createdAt:string;decision:unknown};

function last4(value?:string){return value?value.slice(-4):undefined}

export async function saveAdminOperations(user:User,householdId?:string){
 requireAdmin(user);

 const [
  baselines,opportunities,quotes,ledger,consents,handoffs,activity,notices,vehicles,extractions,decisions
 ]=await Promise.all([
  all<Stored<PolicyBaseline>>('save_policy_baseline',householdId),
  all<Stored<SavingsOpportunity>>('save_opportunity',householdId),
  all<ComparableQuote>('save_quote',householdId),
  all<VerifiedSavingsLedgerEntry>('save_ledger',householdId),
  all<SaveConsentRecord>('save_consent',householdId),
  all<CoverHandoff>('save_cover_handoff',householdId),
  all<SaveActivity>('save_activity',householdId),
  all<SaveNotice>('save_notice',householdId),
  all<VehicleRecord>('save_vehicle',householdId),
  all<ExtractionRecord>('save_policy_extraction',householdId),
  all<DecisionRecord>('save_decision',householdId)
 ]);

 const households=new Set<string>();
 for(const rows of [baselines,opportunities,quotes,ledger,consents,handoffs,activity,notices,vehicles,extractions,decisions]){
  for(const row of rows)households.add(row.householdId);
 }

 if(!householdId){
  const summaries=[...households].map(id=>{
   const hs=<T extends {householdId:string}>(rows:T[])=>rows.filter(x=>x.householdId===id);
   const verified=hs(ledger);
   const latestBaseline=hs(baselines).sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt))[0];
   const latestQuote=hs(quotes).sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt))[0];
   const latestActivity=hs(activity).sort((a,b)=>b.at.localeCompare(a.at))[0];
   return {
    householdId:id,
    baseline:Boolean(latestBaseline),
    renewalDate:latestBaseline?.renewalDate,
    opportunityCount:hs(opportunities).length,
    quoteCount:hs(quotes).length,
    latestQuoteAt:latestQuote?.capturedAt,
    consentCount:hs(consents).filter(x=>x.granted).length,
    coverHandoffCount:hs(handoffs).length,
    verifiedSavingsCount:verified.length,
    verifiedAnnualSavings:verified.reduce((sum,x)=>sum+x.annualSavings,0),
    noticeCount:hs(notices).length,
    latestActivityAt:latestActivity?.at,
    policyReviewPending:hs(extractions).some(x=>x.status==='REQUIRES_REVIEW')
   };
  }).sort((a,b)=>(b.latestActivityAt||'').localeCompare(a.latestActivityAt||''));

  return {
   mode:'summary' as const,
   households:summaries,
   totals:{
    households:summaries.length,
    opportunities:opportunities.length,
    quotes:quotes.length,
    verifiedSavingsEntries:ledger.length,
    verifiedAnnualSavings:ledger.reduce((sum,x)=>sum+x.annualSavings,0),
    coverHandoffs:handoffs.length,
    pendingPolicyReviews:extractions.filter(x=>x.status==='REQUIRES_REVIEW').length
   },
   boundary:'Operational inspection only. Guardian approval remains required for insurance consent, quote submission, telematics enrollment, carrier selection, binding, cancellation and payment.'
  };
 }

 return {
  mode:'household' as const,
  householdId,
  baseline:baselines.sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt))[0],
  opportunities:opportunities.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),
  decisions:decisions.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),
  quotes:quotes.sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt)),
  verifiedSavings:ledger.sort((a,b)=>b.verifiedAt.localeCompare(a.verifiedAt)),
  consents:consents.sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt)),
  coverHandoffs:handoffs.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),
  activity:activity.sort((a,b)=>b.at.localeCompare(a.at)),
  notices:notices.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),
  vehicles:vehicles.map(v=>({...v,vin:v.vin?'••••'+last4(v.vin):undefined})),
  policyExtractions:extractions.map(x=>({id:x.id,householdId:x.householdId,ownerId:x.ownerId,status:x.status,createdAt:x.createdAt})),
  verifiedAnnualSavings:ledger.reduce((sum,x)=>sum+x.annualSavings,0),
  boundary:'Read-only admin operations view. Consequential insurance actions remain guardian/HIL controlled.'
 };
}
