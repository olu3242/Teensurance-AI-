import {command} from '@/lib/platform/commands';
import {dashboard,execute,audit} from '@/lib/platform/service';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {AppError,rateLimit} from '@/lib/platform/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{return json(dashboard(requestUser(request),new URL(request.url).searchParams.get('household')||undefined))}catch(error){return errorResponse(error)}}
export async function POST(request:Request){try{
 sameOrigin(request);const user=requestUser(request);if(!rateLimit(`actions:${user.id}`,120,60000))throw new AppError('Please wait a moment before trying again.',429);
 const parsed=command.safeParse(await body(request));if(!parsed.success){audit(user.id,'','invalid.command','DENY','Input schema rejected the request.');throw new AppError(parsed.error.issues[0]?.message||'Check the form fields.')}
 const key=request.headers.get('idempotency-key');if(!key||!/^[a-zA-Z0-9_-]{16,100}$/.test(key))throw new AppError('A valid request key is required.');
 const result=execute(user,parsed.data,key);return json(result,result.status);
 }catch(error){return errorResponse(error)}}
