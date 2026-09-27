import {z} from 'zod';
import {createSession,login,register,logout,rateLimit,AppError} from '@/lib/platform/auth';
import {body,cookieName,errorResponse,json,requestUser,sameOrigin,tokenFrom} from '@/lib/platform/http';
import {audit} from '@/lib/platform/service';
export const runtime='nodejs';export const dynamic='force-dynamic';
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('register'),email:z.string().email().max(254),password:z.string().min(12).max(128),name:z.string().trim().min(2).max(80)}).strict(),
 z.object({action:z.literal('login'),email:z.string().email().max(254),password:z.string().min(1).max(128)}).strict(),
 z.object({action:z.literal('logout')}).strict(),
]);
export async function GET(request:Request){try{return json({user:requestUser(request)})}catch(error){return errorResponse(error)}}
export async function POST(request:Request){try{
 sameOrigin(request);const parsed=input.safeParse(await body(request));if(!parsed.success)throw new AppError('Enter a valid email, name, and password (at least 12 characters).');const data=parsed.data;
 if(data.action==='logout'){const token=tokenFrom(request);if(token)logout(token);const response=json({ok:true});response.cookies.set(cookieName,'',{httpOnly:true,sameSite:'strict',path:'/',maxAge:0});return response}
 if(!rateLimit(`auth:${data.email.toLowerCase()}`,10)||!rateLimit('auth:global',100))throw new AppError('Too many attempts. Try again in 15 minutes.',429);
 const user=data.action==='register'?register(data.email,data.password,data.name):login(data.email,data.password);const token=createSession(user);const prior=tokenFrom(request);if(prior)logout(prior);audit(user.id,'',`auth.${data.action}`,'ALLOW','Account credentials verified; new expiring session.');const response=json({user});response.cookies.set(cookieName,token,{httpOnly:true,sameSite:'strict',secure:new URL(request.url).protocol==='https:',path:'/',maxAge:7*86400});return response;
 }catch(error){return errorResponse(error)}}
