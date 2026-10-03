import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {inspectLegalEscalations,transitionLegalEscalation} from '@/lib/platform/legal-escalation';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{return json({items:await inspectLegalEscalations(await requestUser(r))})}catch(e){return errorResponse(e)}}
export async function POST(r:Request){try{sameOrigin(r);return json({result:await transitionLegalEscalation(await requestUser(r),await body(r))})}catch(e){return errorResponse(e)}}
