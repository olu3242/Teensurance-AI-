import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {executeIntelligence,readIntelligence} from '@/lib/roadready/intelligence-service';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(request:Request){try{const user=requestUser(request);const p=new URL(request.url).searchParams;if([...p.keys()].some(k=>!['householdId','teenId'].includes(k)))return json({error:'Invalid scope.'},400);const r=readIntelligence(user,p.get('householdId')||'',p.get('teenId')||'');return json(r,r.status)}catch(error){return errorResponse(error)}}
export async function POST(request:Request){try{const user=requestUser(request);sameOrigin(request);const r=executeIntelligence(user,await body(request),request.headers.get('idempotency-key')||'');return json(r,r.status)}catch(error){return errorResponse(error)}}
