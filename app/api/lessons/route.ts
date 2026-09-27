import {NextResponse} from 'next/server';import {z} from 'zod';import {drivingLessons} from '@/lib/driving-lessons';import {readState,updateState} from '@/lib/store';
export const runtime='nodejs';export const dynamic='force-dynamic';
const input=z.object({lessonId:z.string(),scenarioId:z.string().optional(),choiceId:z.string().optional(),complete:z.boolean().optional()});
export async function GET(){const state=await readState();return NextResponse.json({lessons:drivingLessons,attempts:state.lessonAttempts},{headers:{'Cache-Control':'no-store'}})}
export async function POST(request:Request){
 const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Invalid lesson action.'},{status:400});
 const {lessonId,scenarioId,choiceId,complete}=parsed.data;const lesson=drivingLessons.find(x=>x.id===lessonId);if(!lesson)return NextResponse.json({error:'Unknown lesson.'},{status:404});
 let feedback='';let safe:boolean|undefined;
 if(scenarioId||choiceId){const scenario=lesson.scenarios.find(x=>x.id===scenarioId);const choice=scenario?.choices.find(x=>x.id===choiceId);if(!scenario||!choice)return NextResponse.json({error:'Unknown scenario choice.'},{status:400});feedback=choice.feedback;safe=choice.safe}
 const state=await updateState(state=>{const now=new Date().toISOString();const completed=new Set(state.lessonAttempts.filter(x=>x.completedAt).map(x=>x.lessonId));if(!lesson.prerequisites.every(x=>completed.has(x)))return state;
  const existing=state.lessonAttempts.find(x=>x.lessonId===lessonId);if(existing){existing.scenarioId=scenarioId||existing.scenarioId;existing.choiceId=choiceId||existing.choiceId;existing.safe=safe??existing.safe;existing.updatedAt=now;if(complete)existing.completedAt=now}else state.lessonAttempts.push({lessonId,scenarioId,choiceId,safe,updatedAt:now,completedAt:complete?now:undefined});return state});
 return NextResponse.json({state,feedback:feedback||undefined},{headers:{'Cache-Control':'no-store'}});
}
