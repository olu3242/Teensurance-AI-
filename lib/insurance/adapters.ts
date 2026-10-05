import {createHash} from 'node:crypto';
import type {CarrierQuote,CarrierQuoteResult,NormalizedQuoteRequest} from './types';

export interface CarrierAdapter {
  id:string;
  displayName:string;
  supportedJurisdictions:string[];
  quote(request:NormalizedQuoteRequest):Promise<CarrierQuoteResult>;
}

function stableNumber(value:string){
  const digest=createHash('sha256').update(value).digest();
  return digest.readUInt32BE(0);
}

function sandboxQuote(
  carrierId:string,
  carrierDisplayName:string,
  request:NormalizedQuoteRequest,
  baseMonthly:number
):CarrierQuoteResult{
  const vehicleFactor=request.vehicles.reduce((sum,vehicle)=>sum+Math.max(0,2026-vehicle.year)*85,0);
  const coverageFactor=request.coverageLevel==='state_minimum'?0:request.coverageLevel==='standard'?4200:7600;
  const intentFactor=request.intent==='new_policy'?2100:request.intent==='compare_current'?900:0;
  const variation=stableNumber(`${carrierId}:${request.requestId}`)%3200;
  const monthlyPremiumCents=Math.max(5000,baseMonthly+coverageFactor+intentFactor+vehicleFactor+variation);
  const sixMonthPremiumCents=monthlyPremiumCents*6;
  const deductibleCents=request.coverageLevel==='higher_limits'?50000:100000;
  const quoteId=`${carrierId}-${createHash('sha256').update(request.requestId).digest('hex').slice(0,16)}`;

  const quote:CarrierQuote={
    carrierId,
    carrierDisplayName,
    quoteId,
    monthlyPremiumCents,
    sixMonthPremiumCents,
    deductibleCents,
    coverageLevel:request.coverageLevel,
    synthetic:true,
    bindable:false,
    expiresAt:new Date(Date.parse(request.createdAt)+30*60*1000).toISOString(),
    disclosures:[
      'Sandbox estimate only; this is not an insurer quote, offer, recommendation, or binder.',
      'Premiums are synthetic test data and must not be presented as real market pricing.',
      'Readiness evidence is not used in this sandbox premium calculation.'
    ]
  };
  return {carrierId,status:'quoted',quote};
}

export class SandboxCarrierAdapter implements CarrierAdapter{
  constructor(
    public id:string,
    public displayName:string,
    public supportedJurisdictions:string[],
    private baseMonthly:number
  ){}
  async quote(request:NormalizedQuoteRequest):Promise<CarrierQuoteResult>{
    if(!this.supportedJurisdictions.includes(request.jurisdiction)){
      return {carrierId:this.id,status:'unavailable',reason:'Carrier sandbox is not configured for this jurisdiction.'};
    }
    return sandboxQuote(this.id,this.displayName,request,this.baseMonthly);
  }
}

class CertificationCarrierAdapter implements CarrierAdapter{
  id='certification-carrier';
  displayName='Certification Carrier';
  supportedJurisdictions=['TX','PA'];
  async quote(request:NormalizedQuoteRequest):Promise<CarrierQuoteResult>{
    const monthlyPremiumCents=14500;
    return {carrierId:this.id,status:'quoted',quote:{
      carrierId:this.id,
      carrierDisplayName:this.displayName,
      quoteId:'cert-'+createHash('sha256').update(request.requestId).digest('hex').slice(0,16),
      monthlyPremiumCents,
      sixMonthPremiumCents:monthlyPremiumCents*6,
      deductibleCents:100000,
      coverageLevel:request.coverageLevel,
      synthetic:false,
      bindable:true,
      expiresAt:new Date(Date.parse(request.createdAt)+30*60*1000).toISOString(),
      disclosures:[
        'Certification-only carrier fixture. It is available only when TEENSURANCE_INSURANCE_E2E=1.',
        'No real insurance carrier, quote, policy, premium, or coverage is represented.'
      ]
    }};
  }
}

export const defaultCarrierAdapters:CarrierAdapter[]=[
  new SandboxCarrierAdapter('sandbox-alpha','Sandbox Carrier Alpha',['TX','PA'],11800),
  new SandboxCarrierAdapter('sandbox-beta','Sandbox Carrier Beta',['TX','PA'],13200),
  ...(process.env.TEENSURANCE_INSURANCE_E2E==='1'?[new CertificationCarrierAdapter()]:[])
];

export async function collectCarrierQuotes(
  request:NormalizedQuoteRequest,
  adapters:CarrierAdapter[]=defaultCarrierAdapters
){
  const eligible=adapters.filter(adapter=>adapter.supportedJurisdictions.includes(request.jurisdiction));
  if(!eligible.length)return [] as CarrierQuoteResult[];
  return Promise.all(eligible.map(adapter=>adapter.quote(request)));
}
