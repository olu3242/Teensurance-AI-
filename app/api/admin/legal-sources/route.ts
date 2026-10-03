import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {inspectLegalSourceQueue,queueLegalSource,transitionLegalSource} from '@/lib/platform/legal-source-queue';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{return json({items:await inspectLegalSourceQueue(await requestUser(r))})}catch(e){return errorResponse(e)}}
export async function POST(r:Request){try{sameOrigin(r);const user=await requestUser(r);const payload=await body(r) as Record<string,unknown>;return json({result:payload.action==='transition'?await transitionLegalSource(user,payload.data):await queueLegalSource(user,payload.data)})}catch(e){return errorResponse(e)}}
