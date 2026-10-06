import {all,db,put} from '@/lib/platform/db';
import type {PolicyBaseline} from './types';
import {evaluateRenewalWatch} from './renewal';
import {savingsOpportunityNotice,renewalNotice} from './notification-content';
import {randomUUID} from 'node:crypto';

type StoredBaseline=PolicyBaseline&{id:string;ownerId:string};
type SaveNoticeRecord={
 id:string;householdId:string;ownerId:string;kind:'renewal'|'opportunity';
 subject:string;message:string;status:'queued'|'suppressed';createdAt:string;
};

export async function processRenewalWatches(now=new Date()){
 const baselines=await all<StoredBaseline>('save_policy_baseline');
 let scanned=0,queued=0,suppressed=0;
 for(const baseline of baselines){
  scanned++;
  const watch=evaluateRenewalWatch(baseline,now);
  if(!watch.shouldNotify||watch.daysUntilRenewal===undefined){suppressed++;continue}
  const key=`${baseline.householdId}:${baseline.renewalDate}:${watch.event?.type}`;
  const existing=(await all<(SaveNoticeRecord&{dedupeKey?:string})>('save_notice',baseline.householdId)).find(x=>x.dedupeKey===key);
  if(existing){suppressed++;continue}
  const notice=renewalNotice(watch.daysUntilRenewal);
  await put('save_notice',{id:randomUUID(),householdId:baseline.householdId,ownerId:baseline.ownerId,kind:'renewal',subject:notice.subject,message:notice.message,status:'queued',createdAt:new Date().toISOString(),dedupeKey:key});
  queued++;
 }
 return {scanned,queued,suppressed};
}

export async function queueOpportunityNotice(input:{householdId:string;ownerId:string;reason:string;nextAction:string;opportunityId:string}){
 const key=`${input.householdId}:${input.opportunityId}`;
 const existing=(await all<(SaveNoticeRecord&{dedupeKey?:string})>('save_notice',input.householdId)).find(x=>x.dedupeKey===key);
 if(existing)return {queued:false,reason:'Duplicate opportunity notice suppressed.'};
 const notice=savingsOpportunityNotice(input.reason,input.nextAction);
 await put('save_notice',{id:randomUUID(),householdId:input.householdId,ownerId:input.ownerId,kind:'opportunity',subject:notice.subject,message:notice.message,status:'queued',createdAt:new Date().toISOString(),dedupeKey:key});
 return {queued:true};
}

export async function saveIntegrationHealth(){
 const raw=process.env.TEENSURANCE_CARRIER_ADAPTERS;
 let configured:number|null=0;
 let configurationValid=true;
 if(raw){try{const parsed=JSON.parse(raw) as unknown[];configured=Array.isArray(parsed)?parsed.length:null;if(configured===null)configurationValid=false}catch{configured=null;configurationValid=false}}
 const counts=await db().prepare("SELECT kind,COUNT(*) AS count FROM records WHERE kind IN ('save_policy_baseline','save_opportunity','save_quote','save_ledger','save_consent','save_cover_handoff','save_activity','save_notice') GROUP BY kind").all();
 return {
  carrierAdapters:{configured,configurationValid},
  persistence:Object.fromEntries(counts.map(r=>[String(r.kind),Number(r.count)])),
  hostedPersistenceExpected:process.env.VERCEL==='1'||process.env.TEENSURANCE_ENV==='production',
  postgresConfigured:Boolean(process.env.DATABASE_URL),
  emailProviderConfigured:Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM),
  cronSecretConfigured:Boolean(process.env.CRON_SECRET)
 };
}
