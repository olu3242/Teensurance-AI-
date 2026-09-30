import {all} from '@/lib/platform/db';
import type {User} from '@/lib/platform/types';
import {AppError} from '@/lib/platform/auth';
import {requireSaveGuardian} from './authorization';
import {getSaveConsents} from './consent';
import {configuredCarrierAdapters,type CarrierAdapterConfig} from './carriers';
import {QuoteOrchestrator} from './quotes';
import {saveComparableQuote} from './service';
import type {PolicyBaseline} from './types';

function configuredFromEnv():CarrierAdapterConfig[]{
 const raw=process.env.TEENSURANCE_CARRIER_ADAPTERS;
 if(!raw)return[];
 try{return JSON.parse(raw) as CarrierAdapterConfig[]}catch{throw new AppError('Carrier adapter configuration is invalid.',500)}
}

export async function requestMarketplaceQuotes(user:User,householdId:string,input:{annualMileage?:number;vehicleVins?:string[]}={}){
 await requireSaveGuardian(user,householdId);
 const consents=await getSaveConsents(user,householdId);
 if(!consents.marketplace?.granted)throw new AppError('Parent marketplace consent is required before requesting quotes.',403);
 const baseline=(await all<(PolicyBaseline&{id:string})>('save_policy_baseline',householdId))[0];
 if(!baseline?.coverageFingerprint)throw new AppError('A reviewed coverage fingerprint is required before quote comparison.',409);
 const providers=configuredCarrierAdapters(configuredFromEnv());
 if(!providers.length)throw new AppError('No carrier quote providers are configured yet.',503);
 const orchestrator=new QuoteOrchestrator(providers);
 const result=await orchestrator.compare({
  householdId,
  coverageFingerprint:baseline.coverageFingerprint,
  drivers:baseline.drivers,
  vehicles:baseline.vehicles,
  annualMileage:input.annualMileage,
  vehicleVins:input.vehicleVins,
  consents:{marketplace:true,telematics:Boolean(consents.telematics?.granted)}
 });
 const saved=[];
 for(const q of result.quotes)saved.push(await saveComparableQuote(user,{householdId,provider:q.provider,annualPremium:q.annualPremium,coverageFingerprint:q.coverageFingerprint,source:q.source}));
 return {quotes:saved,providerErrors:result.providerErrors};
}
