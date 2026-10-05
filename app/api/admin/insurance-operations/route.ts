import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {insuranceOperations,replayInsuranceTrigger} from '@/lib/insurance/operations';
import {AppError} from '@/lib/platform/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{return json(await insuranceOperations(await requestUser(request)))}catch(error){return errorResponse(error)}}
export async function POST(request:Request){try{sameOrigin(request);const user=await requestUser(request);const input=await body(request) as {action?:'replay';triggerId?:string};if(input.action!=='replay'||!input.triggerId)throw new AppError('Replay trigger is required.',400);return json({trigger:await replayInsuranceTrigger(user,input.triggerId)})}catch(error){return errorResponse(error)}}
