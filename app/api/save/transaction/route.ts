import {z} from 'zod';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {AppError,rateLimit} from '@/lib/platform/auth';
import {getSaveConsents,setSaveConsent} from '@/lib/save/consent';
import {requestMarketplaceQuotes} from '@/lib/save/quote-service';
import {listCoverHandoffs,prepareCoverHandoff} from '@/lib/save/cover-handoff';
import {recordSaveActivity,saveActivityHistory} from '@/lib/save/activity';

export const runtime='nodejs';export const dynamic='force-dynamic';

const command=z.discriminatedUnion('action',[
 z.object({action:z.literal('consent.set'),householdId:z.string().min(1),type:z.enum(['marketplace','telematics','document_processing']),granted:z.boolean()}),
 z.object({action:z.literal('quotes.request'),householdId:z.string().min(1),annualMileage:z.number().nonnegative().optional(),vehicleVins:z.array(z.string()).optional()}),
 z.object({action:z.literal('cover.prepare'),householdId:z.string().min(1),quoteId:z.string().min(1)}),
 z.object({action:z.literal('decision.record'),householdId:z.string().min(1),summary:z.string().min(3).max(500),quoteId:z.string().optional()})
]);

export async function GET(request:Request){
 try{
  const user=await requestUser(request),householdId=new URL(request.url).searchParams.get('household');
  if(!householdId)throw new AppError('Choose a household.',400);
  const [consents,handoffs,activity]=await Promise.all([getSaveConsents(user,householdId),listCoverHandoffs(user,householdId),saveActivityHistory(user,householdId)]);
  return json({consents,handoffs,activity});
 }catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
 try{
  sameOrigin(request);const user=await requestUser(request);
  if(!(await rateLimit('save-transaction:'+user.id,30,60000)))throw new AppError('Please wait before trying again.',429);
  const parsed=command.safeParse(await body(request));if(!parsed.success)throw new AppError(parsed.error.issues[0]?.message||'Check the SAVE transaction request.',400);
  const c=parsed.data;
  if(c.action==='consent.set'){
   const result=await setSaveConsent(user,c.householdId,c.type,c.granted);
   await recordSaveActivity(user,c.householdId,'consent',(c.granted?'Granted ':'Revoked ')+c.type+' consent.');
   return json(result);
  }
  if(c.action==='quotes.request'){
   await recordSaveActivity(user,c.householdId,'quote_requested','Parent requested comparable marketplace quotes.');
   const result=await requestMarketplaceQuotes(user,c.householdId,{annualMileage:c.annualMileage,vehicleVins:c.vehicleVins});
   await recordSaveActivity(user,c.householdId,'quote_received','Comparable quote request completed.',{quoteCount:result.quotes.length,providerErrors:result.providerErrors});
   return json(result);
  }
  if(c.action==='cover.prepare'){
   const result=await prepareCoverHandoff(user,c.householdId,c.quoteId);
   await recordSaveActivity(user,c.householdId,'cover_handoff','Parent prepared a non-binding COVER handoff.',{quoteId:c.quoteId,provider:result.provider});
   return json(result);
  }
  return json(await recordSaveActivity(user,c.householdId,'decision',c.summary,c.quoteId?{quoteId:c.quoteId}:undefined));
 }catch(error){return errorResponse(error)}
}
