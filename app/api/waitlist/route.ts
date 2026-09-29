import {body,errorResponse,json,sameOrigin} from '@/lib/platform/http';
import {hash,rateLimit,AppError} from '@/lib/platform/auth';
import {joinWaitlist} from '@/lib/waitlist/service';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(r:Request){try{sameOrigin(r);const forwarded=r.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||r.headers.get('x-real-ip')||'unknown';if(!(await rateLimit(`waitlist:${hash(forwarded)}`,8,60*60*1000)))throw new AppError('Too many requests. Please try again later.',429);return json(await joinWaitlist(await body(r)),201)}catch(e){return errorResponse(e)}}
