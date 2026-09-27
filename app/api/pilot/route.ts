import {NextResponse} from 'next/server';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {guard,nextBestStep,pilotAnalytics,progress,readinessPassport,type Role,type DrivingState} from '@/lib/domain';
import {readState,updateState} from '@/lib/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const common={role:z.enum(['teen','parent']),drivingState:z.enum(['parked','driving']),requestId:z.string().uuid().optional()};
const input = z.discriminatedUnion('action',[
 z.object({action:z.literal('plan'),...common,skill:z.string().trim().min(1).max(60),objective:z.string().trim().min(3).max(180),supervisor:z.string().trim().min(2).max(80)}),
 z.object({action:z.literal('safety'),...common,topic:z.enum(['phone_away','seatbelt_setup','mirrors_controls','supervisor_ready','emergency_plan'])}),
 z.object({action:z.literal('log'),role:z.literal('teen'),drivingState:z.enum(['parked','driving']),requestId:z.string().uuid().optional(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),minutes:z.number().int().min(1).max(240),night:z.boolean(),skill:z.string().trim().min(1).max(60),supervisor:z.string().trim().min(2).max(80),note:z.string().trim().max(300)}),
 z.object({action:z.literal('reflect'),...common,logId:z.string().uuid(),confidence:z.enum(['building','steady','confident']),challenge:z.string().trim().max(180),nextFocus:z.string().trim().min(2).max(120)}),
 z.object({action:z.literal('verify'),...common,id:z.string().uuid()}),
 z.object({action:z.literal('correct'),...common,id:z.string().uuid(),minutes:z.number().int().min(1).max(240),reason:z.string().trim().min(3).max(180)}),
 z.object({action:z.literal('dispute'),...common,id:z.string().uuid(),reason:z.string().trim().min(3).max(180)}),
 z.object({action:z.literal('jurisdiction'),...common,name:z.string().trim().min(2).max(80),officialSourceUrl:z.literal('')}),
 z.object({action:z.literal('goal'),...common,hours:z.number().int().min(1).max(200)})
]);
const view=(state:Awaited<ReturnType<typeof readState>>)=>({state,progress:progress(state),passport:readinessPassport(state),nextBestStep:nextBestStep(state),analytics:pilotAnalytics(state),stepsSource:'Demo guidance only. Jurisdiction requirements remain unverified until an official source is reviewed.'});
export async function GET(){const state=await readState();return NextResponse.json(view(state),{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON.'},{status:400});}
 const parsed=input.safeParse(body);if(!parsed.success)return NextResponse.json({error:'Check the required fields and try again.'},{status:400});const data=parsed.data;
 if(data.action==='log'){const timestamp=Date.parse(`${data.date}T12:00:00Z`);if(!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==data.date||data.date>new Date().toISOString().slice(0,10))return NextResponse.json({error:'Choose a valid date that is not in the future.'},{status:400});}
 const result=await updateState(state=>{
  if(data.requestId&&state.processedRequests.includes(data.requestId))return{policy:{decision:'ALLOW' as const,reason:'This request was already saved. No duplicate was created.'},...view(state)};
  const policy=guard(data.action,data.role as Role,data.drivingState as DrivingState,state,data as unknown as Record<string,unknown>);const now=new Date().toISOString();
  state.audit.unshift({id:randomUUID(),at:now,action:data.action,actor:data.role,drivingState:data.drivingState,decision:policy.decision,reason:policy.reason});if(state.audit.length>300)state.audit.length=300;
  if(policy.decision!=='ALLOW')return{policy,...view(state)};
  if(data.requestId){state.processedRequests.push(data.requestId);if(state.processedRequests.length>300)state.processedRequests.shift();}
  if(data.action==='plan')state.activePlan={id:randomUUID(),skill:data.skill,objective:data.objective,supervisor:data.supervisor,createdAt:now};
  if(data.action==='safety'){state.safetyChecks=state.safetyChecks.filter(item=>item.topic!==data.topic);state.safetyChecks.push({topic:data.topic,completedBy:data.role,completedAt:now});}
  if(data.action==='log'){state.logs.unshift({id:randomUUID(),date:data.date,minutes:data.minutes,night:data.night,skill:data.skill,supervisor:data.supervisor,note:data.note,status:'pending',createdAt:now});if(state.activePlan)state.activePlan.completedAt=now;}
  if(data.action==='reflect'){state.reflections=state.reflections.filter(item=>item.logId!==data.logId);state.reflections.unshift({logId:data.logId,confidence:data.confidence,challenge:data.challenge,nextFocus:data.nextFocus,createdAt:now});}
  if(data.action==='verify'){const log=state.logs.find(l=>l.id===data.id)!;log.status='verified';log.verifiedAt=now;log.reviewedBy='parent';}
  if(data.action==='correct'){const log=state.logs.find(l=>l.id===data.id)!;const previousMinutes=log.minutes;log.minutes=data.minutes;log.status='pending';delete log.verifiedAt;delete log.reviewedBy;state.corrections.unshift({id:randomUUID(),logId:log.id,actor:'parent',previousMinutes,newMinutes:data.minutes,reason:data.reason,createdAt:now});}
  if(data.action==='dispute'){const log=state.logs.find(l=>l.id===data.id)!;log.status='disputed';log.disputeReason=data.reason;delete log.verifiedAt;delete log.reviewedBy;}
  if(data.action==='jurisdiction')state.jurisdiction={name:data.name,status:'unverified'};
  if(data.action==='goal')state.goalHours=data.hours;
  return{policy,...view(state)};
 });return NextResponse.json(result,{status:result.policy.decision==='ALLOW'?200:403,headers:{'Cache-Control':'no-store'}});
}
