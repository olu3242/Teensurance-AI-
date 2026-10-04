import {AppError,rateLimit} from '@/lib/platform/auth';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {orchestrateInsurance} from '@/lib/insurance/orchestrator';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const user=await requestUser(request);const householdId=new URL(request.url).searchParams.get('householdId')||'';
 if(!householdId)throw new AppError('Choose a household.',400);
 const {result,trace}=await orchestrateInsurance(user,{action:'notification.generate',householdId,source:'domain'},{});return json({...result as object,trace});
}catch(error){return errorResponse(error)}}
export async function POST(request:Request){try{
 sameOrigin(request);const user=await requestUser(request);
 if(!(await rateLimit('insurance-notifications:'+user.id,60,60000)))throw new AppError('Please wait before updating notifications.',429);
 const input=await body(request) as {householdId?:string;id?:string;status?:'read'|'dismissed'};
 if(!input.householdId||!input.id||!input.status)throw new AppError('Notification and status are required.',400);
 const action=input.status==='read'?'notification.read':'notification.dismiss';
 const {result:notification,trace}=await orchestrateInsurance(user,{action,householdId:input.householdId,source:'user'},input);return json({notification,trace});
}catch(error){return errorResponse(error)}}
