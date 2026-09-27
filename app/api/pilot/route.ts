import {NextResponse} from 'next/server';
import {z} from 'zod';
import {buildContext,orchestrate,type OrchestrationCommand} from '@/lib/os';
import {readState,updateState} from '@/lib/store';
export const runtime='nodejs';export const dynamic='force-dynamic';

const common={role:z.enum(['teen','parent']),drivingState:z.enum(['parked','driving']),requestId:z.string().uuid().optional()};
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('plan'),...common,skill:z.string().trim().min(1).max(60),objective:z.string().trim().min(3).max(180),supervisor:z.string().trim().min(2).max(80)}),
 z.object({action:z.literal('safety'),...common,topic:z.enum(['phone_away','seatbelt_setup','mirrors_controls','supervisor_ready','emergency_plan'])}),
 z.object({action:z.literal('log'),role:z.literal('teen'),drivingState:z.enum(['parked','driving']),requestId:z.string().uuid().optional(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),minutes:z.number().int().min(1).max(240),night:z.boolean(),skill:z.string().trim().min(1).max(60),supervisor:z.string().trim().min(2).max(80),note:z.string().trim().max(300)}),
 z.object({action:z.literal('reflect'),...common,logId:z.string().uuid(),confidence:z.enum(['building','steady','confident']),challenge:z.string().trim().max(180),nextFocus:z.string().trim().min(2).max(120)}),
 z.object({action:z.literal('verify'),...common,id:z.string().uuid()}),
 z.object({action:z.literal('correct'),...common,id:z.string().uuid(),minutes:z.number().int().min(1).max(240),reason:z.string().trim().min(3).max(180)}),
 z.object({action:z.literal('dispute'),...common,id:z.string().uuid(),reason:z.string().trim().min(3).max(180)}),
 z.object({action:z.literal('jurisdiction'),...common,name:z.string().trim().min(2).max(80),officialSourceUrl:z.string().url().optional()}),
 z.object({action:z.literal('cover'),...common,item:z.enum(['householdReviewed','vehicleInfoReady','questionsPrepared']),complete:z.boolean()}),
 z.object({action:z.literal('goal'),...common,hours:z.number().int().min(1).max(200)})
]);

export async function GET(){const state=await readState();return NextResponse.json({state,os:buildContext(state),stepsSource:'Workflow OS uses demo guidance only. Legal requirements remain unverified until human-reviewed official sources are implemented.'},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON.'},{status:400});}
 const parsed=input.safeParse(body);if(!parsed.success)return NextResponse.json({error:'Check the required fields and try again.'},{status:400});
 const data=parsed.data;if(data.action==='log'){const timestamp=Date.parse(`${data.date}T12:00:00Z`);if(!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==data.date||data.date>new Date().toISOString().slice(0,10))return NextResponse.json({error:'Choose a valid date that is not in the future.'},{status:400});}
 const result=await updateState(state=>orchestrate(state,data as OrchestrationCommand));
 return NextResponse.json({...result,os:buildContext(result.state)},{status:result.policy.decision==='ALLOW'?200:403,headers:{'Cache-Control':'no-store'}});
}
