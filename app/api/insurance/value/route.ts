import {AppError,rateLimit} from '@/lib/platform/auth';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {orchestrateInsurance} from '@/lib/insurance/orchestrator';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 sameOrigin(request);const user=await requestUser(request);
 if(!(await rateLimit('insurance-value:'+user.id,30,60000)))throw new AppError('Please wait before recording another insurance value event.',429);
 const input=await body(request) as {action?:'baseline'|'projected'|'realized';householdId?:string;teenId?:string;amountCents?:number;period?:'monthly'|'six_month';referenceId?:string;quoteSessionId?:string;quoteId?:string;policyId?:string};
 if(!input.householdId)throw new AppError('Household is required.',400);
 if(input.action==='baseline'){
  if(!input.teenId||!input.amountCents||!input.period||!input.referenceId)throw new AppError('Teen, premium, period, and evidence reference are required.',400);
  const {result:baseline,trace}=await orchestrateInsurance(user,{action:'value.baseline',householdId:input.householdId,teenId:input.teenId,source:'user'},input);return json({baseline,trace},201);
 }
 if(input.action==='projected'){
  if(!input.teenId||!input.quoteSessionId||!input.quoteId)throw new AppError('Teen and quote are required.',400);
  const {result:savings,trace}=await orchestrateInsurance(user,{action:'value.projected',householdId:input.householdId,teenId:input.teenId,source:'user'},input);return json({savings,trace});
 }
 if(input.action==='realized'){
  if(!input.policyId)throw new AppError('Active policy is required.',400);
  const {result:savings,trace}=await orchestrateInsurance(user,{action:'value.realized',householdId:input.householdId,source:'user'},input);return json({savings,trace},201);
 }
 throw new AppError('Choose a valid value-evidence action.',400);
}catch(error){return errorResponse(error)}}
