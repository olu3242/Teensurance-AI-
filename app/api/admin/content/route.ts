import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {changeReview,inspectReviews} from '@/lib/scout/review-service';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{return json({items:await inspectReviews(await requestUser(r))})}catch(e){return errorResponse(e)}}
export async function POST(r:Request){try{sameOrigin(r);return json({result:await changeReview(await requestUser(r),await body(r))})}catch(e){return errorResponse(e)}}
