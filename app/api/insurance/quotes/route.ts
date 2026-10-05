import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {AppError,rateLimit} from '@/lib/platform/auth';
import {readQuoteSessions} from '@/lib/insurance/service';
import {orchestrateInsurance} from '@/lib/insurance/orchestrator';
import type {QuoteInput} from '@/lib/insurance/types';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try{
    const user=await requestUser(request);
    const householdId=new URL(request.url).searchParams.get('householdId')||'';
    if(!householdId)throw new AppError('Choose a household.',400);
    return json({sessions:await readQuoteSessions(user,householdId)});
  }catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
  try{
    sameOrigin(request);
    const user=await requestUser(request);
    if(!(await rateLimit(`insurance-quotes:${user.id}`,30,60000)))throw new AppError('Please wait before requesting more insurance comparisons.',429);
    const idempotencyKey=request.headers.get('idempotency-key')||'';
    const input=await body(request) as QuoteInput;
    const {result:session,trace}=await orchestrateInsurance(user,{action:'quote.request',householdId:input.householdId,teenId:input.teenId,source:'user'},{...input,idempotencyKey});
    return json({session,trace},201);
  }catch(error){return errorResponse(error)}
}
