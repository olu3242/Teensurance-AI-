import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {inspectLegalRuleDrafts,markLegalRuleDraftReady,saveLegalRuleDraft} from '@/lib/platform/legal-rule-drafting';
import {inspectLegalSourceQueue} from '@/lib/platform/legal-source-queue';
import {promoteLegalRuleDraft} from '@/lib/platform/legal-rule-promotion';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{const user=await requestUser(r);const [drafts,sources]=await Promise.all([inspectLegalRuleDrafts(user),inspectLegalSourceQueue(user)]);return json({drafts,sources:sources.filter(s=>s.status==='accepted')})}catch(e){return errorResponse(e)}}
export async function POST(r:Request){try{sameOrigin(r);const user=await requestUser(r);const payload=await body(r) as {action?:string;id?:string;humanAttestation?:boolean;data?:unknown};return json({result:payload.action==='ready'?await markLegalRuleDraftReady(user,String(payload.id),payload.humanAttestation===true):payload.action==='promote'?await promoteLegalRuleDraft(user,String(payload.id),payload.humanAttestation===true):await saveLegalRuleDraft(user,payload.data)})}catch(e){return errorResponse(e)}}
