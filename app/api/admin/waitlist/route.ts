import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {listWaitlist,updateWaitlist} from '@/lib/waitlist/service';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{return json({entries:await listWaitlist(await requestUser(r))})}catch(e){return errorResponse(e)}}
export async function POST(r:Request){try{sameOrigin(r);return json({entry:await updateWaitlist(await requestUser(r),await body(r))})}catch(e){return errorResponse(e)}}
