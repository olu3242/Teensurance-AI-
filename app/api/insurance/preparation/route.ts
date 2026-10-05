import {AppError} from '@/lib/platform/auth';
import {errorResponse,json,requestUser} from '@/lib/platform/http';
import {evaluateInsurancePreparation} from '@/lib/insurance/preparation';
import {routeInsuranceCommand} from '@/lib/insurance/runtime';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try{
    const user=await requestUser(request);
    const params=new URL(request.url).searchParams;
    const householdId=params.get('householdId')||'';
    const teenId=params.get('teenId')||'';
    if(!householdId||!teenId)throw new AppError('Choose a household and teen driver.',400);
    const trace=await routeInsuranceCommand(user,{action:'readiness.evaluate',householdId,teenId,source:'user'});
    return json({opportunity:await evaluateInsurancePreparation(user,householdId,teenId),trace});
  }catch(error){return errorResponse(error)}
}
