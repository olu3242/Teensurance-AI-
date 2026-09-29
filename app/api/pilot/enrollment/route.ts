import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {pilotCommand,pilotView} from '@/lib/pilot/service';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{return json(await pilotView(await requestUser(r),new URL(r.url).searchParams.get('householdId')||''))}catch(e){return errorResponse(e)}}
export async function POST(r:Request){try{sameOrigin(r);return json({result:await pilotCommand(await requestUser(r),await body(r),r.headers.get('idempotency-key')||'')})}catch(e){return errorResponse(e)}}
