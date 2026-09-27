import {NextResponse} from 'next/server';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {guard,progress,readinessPassport,type Role,type DrivingState} from '@/lib/domain';
import {readState,updateState} from '@/lib/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const input = z.discriminatedUnion('action',[
  z.object({action:z.literal('plan'),role:z.enum(['teen','parent']),drivingState:z.enum(['parked','driving']),skill:z.string().trim().min(1).max(60),objective:z.string().trim().min(3).max(180),supervisor:z.string().trim().min(2).max(80)}),
  z.object({action:z.literal('safety'),role:z.enum(['teen','parent']),drivingState:z.enum(['parked','driving']),topic:z.enum(['phone_away','seatbelt_setup','mirrors_controls','supervisor_ready','emergency_plan'])}),
  z.object({action:z.literal('log'),role:z.literal('teen'),drivingState:z.enum(['parked','driving']),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),minutes:z.number().int().min(1).max(240),night:z.boolean(),skill:z.string().trim().min(1).max(60),supervisor:z.string().trim().min(2).max(80),note:z.string().trim().max(300)}),
  z.object({action:z.literal('reflect'),role:z.enum(['teen','parent']),drivingState:z.enum(['parked','driving']),logId:z.string().uuid(),confidence:z.enum(['building','steady','confident']),challenge:z.string().trim().max(180),nextFocus:z.string().trim().min(2).max(120)}),
  z.object({action:z.literal('verify'),role:z.enum(['teen','parent']),drivingState:z.enum(['parked','driving']),id:z.string().uuid()}),
  z.object({action:z.literal('goal'),role:z.enum(['teen','parent']),drivingState:z.enum(['parked','driving']),hours:z.number().int().min(1).max(200)})
]);
export async function GET() {
  const state = await readState();
  return NextResponse.json({state,progress:progress(state),passport:readinessPassport(state),stepsSource:'Demo guidance; verify requirements with your official state or provincial agency.'},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:Request) {
  let body:unknown;
  try {body=await request.json();} catch {return NextResponse.json({error:'Invalid JSON.'},{status:400});}
  const parsed=input.safeParse(body);
  if (!parsed.success) return NextResponse.json({error:'Check the required fields and try again.'},{status:400});
  const data=parsed.data;
  if (data.action==='log') {
    const timestamp=Date.parse(`${data.date}T12:00:00Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0,10)!==data.date || data.date>new Date().toISOString().slice(0,10)) return NextResponse.json({error:'Choose a valid date that is not in the future.'},{status:400});
  }
  const result=await updateState(state=>{
    const policy=guard(data.action,data.role as Role,data.drivingState as DrivingState,state,data as unknown as Record<string,unknown>);
    state.audit.unshift({id:randomUUID(),at:new Date().toISOString(),action:data.action,actor:data.role,drivingState:data.drivingState,decision:policy.decision,reason:policy.reason});
    if (state.audit.length>300) state.audit.length=300;
    if (policy.decision!=='ALLOW') return {policy,state,progress:progress(state),passport:readinessPassport(state)};
    const now=new Date().toISOString();
    if (data.action==='plan') state.activePlan={id:randomUUID(),skill:data.skill,objective:data.objective,supervisor:data.supervisor,createdAt:now};
    if (data.action==='safety') {
      state.safetyChecks=state.safetyChecks.filter(item=>item.topic!==data.topic);
      state.safetyChecks.push({topic:data.topic,completedBy:data.role,completedAt:now});
    }
    if (data.action==='log') {
      state.logs.unshift({id:randomUUID(),date:data.date,minutes:data.minutes,night:data.night,skill:data.skill,supervisor:data.supervisor,note:data.note,status:'pending',createdAt:now});
      if (state.activePlan) state.activePlan.completedAt=now;
    }
    if (data.action==='reflect') {
      state.reflections=state.reflections.filter(item=>item.logId!==data.logId);
      state.reflections.unshift({logId:data.logId,confidence:data.confidence,challenge:data.challenge,nextFocus:data.nextFocus,createdAt:now});
    }
    if (data.action==='verify') {const log=state.logs.find(l=>l.id===data.id)!;log.status='verified';log.verifiedAt=now;}
    if (data.action==='goal') state.goalHours=data.hours;
    return {policy,state,progress:progress(state),passport:readinessPassport(state)};
  });
  return NextResponse.json(result,{status:result.policy.decision==='ALLOW'?200:403,headers:{'Cache-Control':'no-store'}});
}
