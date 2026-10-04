import {AppError,rateLimit} from '@/lib/platform/auth';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {readInsuranceStatus,startBindHandoff} from '@/lib/insurance/bind';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try{
    const user=await requestUser(request);
    const householdId=new URL(request.url).searchParams.get('householdId')||'';
    if(!householdId)throw new AppError('Choose a household.',400);
    return json(await readInsuranceStatus(user,householdId));
  }catch(error){
    return errorResponse(error);
  }
}

export async function POST(request:Request){
  try{
    sameOrigin(request);
    const user=await requestUser(request);
    if(!(await rateLimit(`insurance-bind:${user.id}`,20,60000)))throw new AppError('Please wait before starting another insurance handoff.',429);
    const input=await body(request) as {householdId?:string;selectionId?:string};
    if(!input.householdId||!input.selectionId)throw new AppError('Household and selected offer are required.',400);
    return json({handoff:await startBindHandoff(user,input.householdId,input.selectionId)},201);
  }catch(error){
    return errorResponse(error);
  }
}
