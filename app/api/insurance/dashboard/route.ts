import {AppError} from '@/lib/platform/auth';
import {errorResponse,json,requestUser} from '@/lib/platform/http';
import {parentInsuranceDashboard} from '@/lib/insurance/lifecycle';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){try{const user=await requestUser(request);const householdId=new URL(request.url).searchParams.get('householdId')||'';if(!householdId)throw new AppError('Choose a household.',400);return json(await parentInsuranceDashboard(user,householdId))}catch(error){return errorResponse(error)}}
