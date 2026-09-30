import {z} from 'zod';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {AppError,rateLimit} from '@/lib/platform/auth';
import {evaluateSavings,saveComparableQuote,savePolicyBaseline,savingsDashboard,verifySavings} from '@/lib/save/service';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const baseline=z.object({
 action:z.literal('policy_baseline.save'),householdId:z.string().min(1),
 carrierName:z.string().optional(),annualPremium:z.number().nonnegative().optional(),
 renewalDate:z.string().optional(),coverageFingerprint:z.string().min(1).optional(),
 deductible:z.number().nonnegative().optional(),drivers:z.number().int().min(1),
 vehicles:z.number().int().min(1),currentDiscounts:z.array(z.string()).default([]),
 source:z.enum(['document','carrier','manual'])
});
const evaluate=z.object({
 action:z.literal('savings.evaluate'),householdId:z.string().min(1),now:z.string(),
 driverEducationVerified:z.boolean(),goodStudentEvidenceVerified:z.boolean(),
 collegeAwayFromHome:z.boolean(),annualMileage:z.number().nonnegative().optional(),
 telematicsOptIn:z.boolean().optional(),vehicleAssignmentKnown:z.boolean(),
 householdVehicleCount:z.number().int().nonnegative(),homePolicyKnown:z.boolean()
});
const quote=z.object({
 action:z.literal('quote.capture'),householdId:z.string().min(1),provider:z.string().min(1),
 annualPremium:z.number().nonnegative(),coverageFingerprint:z.string().min(1),
 source:z.enum(['carrier','quote'])
});
const verify=z.object({action:z.literal('savings.verify'),householdId:z.string().min(1),quoteId:z.string().min(1)});
const command=z.discriminatedUnion('action',[baseline,evaluate,quote,verify]);

export async function GET(request:Request){
 try{
   const user=await requestUser(request);const householdId=new URL(request.url).searchParams.get('household');
   if(!householdId)throw new AppError('Choose a household.',400);
   return json(await savingsDashboard(user,householdId));
 }catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
 try{
   sameOrigin(request);const user=await requestUser(request);
   if(!(await rateLimit(`save:${user.id}`,60,60000)))throw new AppError('Please wait a moment before trying again.',429);
   const parsed=command.safeParse(await body(request));if(!parsed.success)throw new AppError(parsed.error.issues[0]?.message||'Check the SAVE request.',400);
   const c=parsed.data;
   if(c.action==='policy_baseline.save')return json(await savePolicyBaseline(user,c));
   if(c.action==='quote.capture')return json(await saveComparableQuote(user,c));
   if(c.action==='savings.verify')return json(await verifySavings(user,c.householdId,c.quoteId));
   const current=await savingsDashboard(user,c.householdId);
   return json(await evaluateSavings(user,{...c,policy:current.baseline}));
 }catch(error){return errorResponse(error)}
}
