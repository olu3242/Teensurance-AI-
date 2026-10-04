import {AppError,rateLimit} from '@/lib/platform/auth';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {recordRenewalDecision,renewalOpportunities,startRenewalReshop} from '@/lib/insurance/renewal';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
 try{const user=await requestUser(request);const householdId=new URL(request.url).searchParams.get('householdId')||'';if(!householdId)throw new AppError('Choose a household.',400);return json({opportunities:await renewalOpportunities(user,householdId)})}catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
 try{
  sameOrigin(request);const user=await requestUser(request);
  if(!(await rateLimit('insurance-renewal:'+user.id,20,60000)))throw new AppError('Please wait before starting another renewal action.',429);
  const input=await body(request) as {action?:'reshop'|'decide';householdId?:string;policyId?:string;quoteSessionId?:string;decision?:'stay'|'switch';selectedCarrierId?:string;selectedQuoteId?:string};
  if(!input.householdId||!input.policyId)throw new AppError('Household and policy are required.',400);
  if(input.action==='reshop'){const key=request.headers.get('idempotency-key')||'';return json(await startRenewalReshop(user,input.householdId,input.policyId,key),201)}
  if(input.action==='decide'){if(!input.quoteSessionId||!input.decision)throw new AppError('Renewal comparison and decision are required.',400);return json({decision:await recordRenewalDecision(user,input.householdId,input.policyId,input.quoteSessionId,input.decision,input.selectedCarrierId,input.selectedQuoteId)},201)}
  throw new AppError('Choose a valid renewal action.',400);
 }catch(error){return errorResponse(error)}
}
