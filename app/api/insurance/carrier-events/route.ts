import {AppError} from '@/lib/platform/auth';
import {errorResponse,json} from '@/lib/platform/http';
import {applyCarrierEvent,carrierWebhookSecret,verifyCarrierSignature,type CarrierEvent} from '@/lib/insurance/bind';
import {routeCarrierCommand} from '@/lib/insurance/runtime';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
  try{
    const raw=await request.text();
    if(Buffer.byteLength(raw)>16384)throw new AppError('Request too large.',413);
    let event:CarrierEvent;
    try{event=JSON.parse(raw) as CarrierEvent}catch{throw new AppError('Invalid JSON.',400)}
    const signature=request.headers.get('x-teensurance-carrier-signature')||'';
    const secret=carrierWebhookSecret(event.carrierId);
    if(!verifyCarrierSignature(raw,signature,secret))throw new AppError('Invalid carrier signature.',401);

    const action=event.type==='policy.active'?'policy.active':
      event.type==='policy.bound'?'policy.bound':
      event.type==='policy.cancelled'?'policy.cancelled':
      event.type==='application.declined'?'application.declined':
      event.type==='application.failed'?'application.failed':'carrier.event';
    const result=await applyCarrierEvent(event);
    const householdId='handoff' in result&&result.handoff?.householdId?result.handoff.householdId:'';
    if(!householdId)throw new AppError('Carrier event could not be associated with a household.',409);
    const trace=await routeCarrierCommand(event.carrierId,{action,householdId,source:'carrier',subjectId:event.externalReference});
    return json({...result,trace});
  }catch(error){return errorResponse(error)}
}
