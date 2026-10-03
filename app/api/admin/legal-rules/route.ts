import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {changeLegalRuleReview,inspectLegalRules} from '@/lib/platform/legal-rule-lifecycle';
import {inspectStateRollout} from '@/lib/platform/state-rollout';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{const user=await requestUser(r);const [items,rollout]=await Promise.all([inspectLegalRules(user),inspectStateRollout(user)]);return json({items,rollout})}catch(e){return errorResponse(e)}}
export async function POST(r:Request){try{sameOrigin(r);return json({result:await changeLegalRuleReview(await requestUser(r),await body(r))})}catch(e){return errorResponse(e)}}
