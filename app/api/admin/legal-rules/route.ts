import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {changeLegalRuleReview,inspectLegalRules} from '@/lib/platform/legal-rule-lifecycle';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{return json({items:await inspectLegalRules(await requestUser(r))})}catch(e){return errorResponse(e)}}
export async function POST(r:Request){try{sameOrigin(r);return json({result:await changeLegalRuleReview(await requestUser(r),await body(r))})}catch(e){return errorResponse(e)}}
