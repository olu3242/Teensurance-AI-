import {AppError,rateLimit} from '@/lib/platform/auth';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {orchestrateInsurance} from '@/lib/insurance/orchestrator';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try{
    const user=await requestUser(request);
    const householdId=new URL(request.url).searchParams.get('householdId')||'';
    if(!householdId)throw new AppError('Choose a household.',400);
    const {result,trace}=await orchestrateInsurance(user,{action:'policy.status.read',householdId,source:'user'},{});
    return json({...result as object,trace});
  }catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
  try{
    sameOrigin(request);
    const user=await requestUser(request);
    if(!(await rateLimit(`insurance-bind:${user.id}`,20,60000)))throw new AppError('Please wait before starting another insurance handoff.',429);
    const input=await body(request) as {householdId?:string;selectionId?:string};
    if(!input.householdId||!input.selectionId)throw new AppError('Household and selected offer are required.',400);
    const {result:handoff,trace}=await orchestrateInsurance(user,{action:'bind.prepare',householdId:input.householdId,source:'user'},input);
    return json({handoff,trace},201);
  }catch(error){return errorResponse(error)}
}
