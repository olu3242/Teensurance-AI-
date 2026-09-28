import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {AppError,rateLimit} from '@/lib/platform/auth';
import {executeRoadReady,readRoadReady} from '@/lib/roadready/service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=requestUser(request);const params=new URL(request.url).searchParams;const response=readRoadReady(user,params.get('householdId')||'',params.get('teenId')||'');return json(response,response.status)}catch(error){return errorResponse(error)}}
export async function POST(request:Request){try{sameOrigin(request);const user=requestUser(request);if(!rateLimit(`roadready:${user.id}`,120,60000))throw new AppError('Please pause before trying again.',429);const response=executeRoadReady(user,await body(request),request.headers.get('idempotency-key')||'');return json(response,response.status)}catch(error){return errorResponse(error)}}
