import {errorResponse,json,requestUser} from '@/lib/platform/http';
import {requireAdmin} from '@/lib/platform/admin';
import {insuranceGapRegistry,gapRegistrySummary} from '@/lib/insurance/gap-registry';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{requireAdmin(await requestUser(request));return json({summary:gapRegistrySummary(),gaps:insuranceGapRegistry})}catch(error){return errorResponse(error)}}
