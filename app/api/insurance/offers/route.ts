import {AppError,rateLimit} from '@/lib/platform/auth';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {compareOffers,selectOffer} from '@/lib/insurance/comparison';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try{
    const user=await requestUser(request);
    const params=new URL(request.url).searchParams;
    const householdId=params.get('householdId')||'';
    const sessionId=params.get('sessionId')||'';
    if(!householdId||!sessionId)throw new AppError('Choose a household and quote session.',400);
    return json({comparison:await compareOffers(user,householdId,sessionId)});
  }catch(error){
    return errorResponse(error);
  }
}

export async function POST(request:Request){
  try{
    sameOrigin(request);
    const user=await requestUser(request);
    if(!(await rateLimit(`insurance-offer:${user.id}`,30,60000)))throw new AppError('Please wait before changing insurance selections.',429);
    const input=await body(request) as {
      householdId?:string;
      sessionId?:string;
      quoteId?:string;
      disclosuresAcknowledged?:boolean;
    };
    if(!input.householdId||!input.sessionId||!input.quoteId)throw new AppError('Household, quote session, and offer are required.',400);
    const selection=await selectOffer(user,input.householdId,input.sessionId,input.quoteId,Boolean(input.disclosuresAcknowledged));
    return json({selection},201);
  }catch(error){
    return errorResponse(error);
  }
}
