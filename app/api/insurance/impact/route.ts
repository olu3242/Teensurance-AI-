import {AppError,rateLimit} from '@/lib/platform/auth';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {createInsuranceImpactEstimate,latestInsuranceImpactEstimate} from '@/lib/insurance/service';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try{
    const user=await requestUser(request);
    const params=new URL(request.url).searchParams;
    const householdId=params.get('householdId')||'';
    const teenId=params.get('teenId')||'';
    if(!householdId||!teenId)throw new AppError('Household and driver are required.',400);
    const response=await latestInsuranceImpactEstimate(user,householdId,teenId);
    return json(response,response.status);
  }catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
  try{
    sameOrigin(request);
    const user=await requestUser(request);
    if(!await rateLimit(`insurance-impact:${user.id}`,30,60000))throw new AppError('Please pause before recalculating.',429);
    const response=await createInsuranceImpactEstimate(user,await body(request));
    return json(response,response.status);
  }catch(error){return errorResponse(error)}
}
