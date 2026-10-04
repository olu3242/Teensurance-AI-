import {AppError} from '@/lib/platform/auth';
import {errorResponse,json} from '@/lib/platform/http';
import {applyCarrierEvent,carrierWebhookSecret,verifyCarrierSignature,type CarrierEvent} from '@/lib/insurance/bind';

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
    return json(await applyCarrierEvent(event));
  }catch(error){
    return errorResponse(error);
  }
}
