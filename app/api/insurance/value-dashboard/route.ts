import {AppError} from '@/lib/platform/auth';
import {errorResponse,json,requestUser} from '@/lib/platform/http';
import {insuranceValueDashboard} from '@/lib/insurance/value-dashboard';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await requestUser(request);const householdId=new URL(request.url).searchParams.get('householdId')||'';if(!householdId)throw new AppError('Choose a household.',400);return json(await insuranceValueDashboard(user,householdId))}catch(error){return errorResponse(error)}}
