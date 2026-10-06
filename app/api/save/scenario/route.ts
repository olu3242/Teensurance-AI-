import {z} from 'zod';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {AppError,rateLimit} from '@/lib/platform/auth';
import {requireSaveGuardian} from '@/lib/save/authorization';
import {runSavingsScenario} from '@/lib/save/scenario';
import {savingsDashboard} from '@/lib/save/service';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const schema=z.object({
 householdId:z.string().min(1),
 proposedAnnualPremium:z.number().nonnegative().optional(),
 proposedDeductible:z.number().nonnegative().optional(),
 annualMileage:z.number().nonnegative().optional(),
 vehicleAssignment:z.string().optional(),
 telematics:z.boolean().optional(),
 coverageFingerprint:z.string().optional(),
 source:z.enum(['carrier','quote','estimate']).default('estimate')
});

export async function POST(request:Request){
 try{
  sameOrigin(request);
  const user=await requestUser(request);
  if(!(await rateLimit(`save-scenario:${user.id}`,60,60000)))throw new AppError('Please wait a moment before trying another scenario.',429);
  const parsed=schema.safeParse(await body(request));
  if(!parsed.success)throw new AppError(parsed.error.issues[0]?.message||'Check the scenario inputs.',400);
  await requireSaveGuardian(user,parsed.data.householdId);
  const current=await savingsDashboard(user,parsed.data.householdId);
  if(!current.baseline)throw new AppError('Capture the current policy before running a scenario.',409);
  return json(runSavingsScenario({
   baseline:current.baseline,
   proposed:{
    annualPremium:parsed.data.proposedAnnualPremium,
    deductible:parsed.data.proposedDeductible,
    annualMileage:parsed.data.annualMileage,
    vehicleAssignment:parsed.data.vehicleAssignment,
    telematics:parsed.data.telematics,
    coverageFingerprint:parsed.data.coverageFingerprint
   },
   source:parsed.data.source
  }));
 }catch(error){return errorResponse(error)}
}
