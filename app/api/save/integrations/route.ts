import {z} from 'zod';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {AppError,rateLimit} from '@/lib/platform/auth';
import {decodeAndSaveVehicle,extractPolicyDocument,savingsPassport} from '@/lib/save/integration-service';

export const runtime='nodejs';export const dynamic='force-dynamic';
const command=z.discriminatedUnion('action',[
 z.object({action:z.literal('policy.extract'),householdId:z.string().min(1),text:z.string().min(20).max(100000),mimeType:z.string().min(1)}),
 z.object({action:z.literal('vehicle.decode'),householdId:z.string().min(1),vin:z.string().min(8).max(17),modelYear:z.number().int().min(1981).max(2100).optional()})
]);

export async function GET(request:Request){
 try{const user=await requestUser(request),url=new URL(request.url),householdId=url.searchParams.get('household');if(!householdId)throw new AppError('Choose a household.',400);
 return json(await savingsPassport(user,householdId,{annualMileage:url.searchParams.get('annualMileage')?Number(url.searchParams.get('annualMileage')):undefined,telematicsConsent:url.searchParams.get('telematicsConsent')==='true'}));
 }catch(error){return errorResponse(error)}
}
export async function POST(request:Request){
 try{sameOrigin(request);const user=await requestUser(request);if(!(await rateLimit(`save-integrations:${user.id}`,30,60000)))throw new AppError('Please wait before trying again.',429);
 const parsed=command.safeParse(await body(request));if(!parsed.success)throw new AppError(parsed.error.issues[0]?.message||'Check the integration request.',400);const c=parsed.data;
 return json(c.action==='policy.extract'?await extractPolicyDocument(user,c.householdId,c.text,c.mimeType):await decodeAndSaveVehicle(user,c.householdId,c.vin,c.modelYear));
 }catch(error){return errorResponse(error)}
}
