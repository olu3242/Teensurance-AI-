import {z} from 'zod';
import {authorizeLearner} from './authorization';
import {db,owned,put,transaction} from './db';
import {AppError} from './auth';
import {audit} from './service';
import {ageOn} from './journey';
import type {Drive,User} from './types';
import {initialState,type LessonAttempt} from '../domain';
import {drivingLessons} from '../driving-lessons';
const selection={householdId:z.string().uuid().optional(),teenId:z.string().uuid().optional()};
export const learningSelection=z.object(selection).strict();
const command=z.object({...selection,lessonId:z.string(),scenarioId:z.string().optional(),choiceId:z.string().optional(),complete:z.boolean().optional()}).strict();
type Progress={id:string;householdId:string;ownerId:string;attempts:LessonAttempt[]};
function context(user:User,selection:unknown){
 const parsed=learningSelection.safeParse(selection);if(!parsed.success)throw new AppError('Invalid learning scope.',400);
 const ctx=authorizeLearner(user,parsed.data.householdId,parsed.data.teenId);
 if(ageOn(ctx.profile.birthDate)<18&&!ctx.profile.consent)throw new AppError('Guardian consent is required.',403);
 if(db().prepare("SELECT 1 FROM records WHERE kind='drive' AND json_extract(payload,'$.status')='active' AND (json_extract(payload,'$.teenId') IN (?,?) OR json_extract(payload,'$.supervisorId')=?) LIMIT 1").get(ctx.teenId,user.id,user.id))throw new AppError('Resume learning after parking.',403);
 return ctx;
}
function projection(ctx:ReturnType<typeof context>){
 const state=initialState();state.goalHours=ctx.profile.goalMinutes/60;
 state.consent.guardianAcknowledged=ctx.profile.consent;
 state.lessonAttempts=owned<Progress>('lesson_progress',ctx.householdId,ctx.teenId).find(p=>p.ownerId===ctx.teenId)?.attempts||[];
 state.logs=owned<Drive>('drive',ctx.householdId,ctx.teenId).filter(d=>d.teenId===ctx.teenId&&['pending','verified','disputed'].includes(d.status)).map(d=>({id:d.id,date:d.startedAt.slice(0,10),minutes:d.minutes,night:d.nightMinutes>0,nightMinutes:d.nightMinutes,skill:d.skill,supervisor:d.supervisorId,note:d.note,status:d.status as 'pending'|'verified'|'disputed',createdAt:d.startedAt}));
 return state;
}
function audited<T>(user:User,action:string,run:()=>T):T{try{return transaction(run)}catch(error){if(error instanceof AppError)audit(user.id,'',action,'DENY','Authenticated request rejected by learning authorization or validation.');throw error}}
export function readLegacyLearning(user:User,selection:unknown={}){return audited(user,'lessons.read',()=>{const ctx=context(user,selection);const state=projection(ctx);audit(user.id,ctx.householdId,'lessons.read','ALLOW','Authenticated relationship-scoped learning projection.');return {state,householdId:ctx.householdId,teenId:ctx.teenId}})}
export function writeLegacyLearning(user:User,raw:unknown){return audited(user,'lessons.submit',()=>{
 const parsed=command.safeParse(raw);if(!parsed.success)throw new AppError('Invalid lesson action.',400);
 const c=parsed.data;const ctx=context(user,{householdId:c.householdId,teenId:c.teenId});
 if(ctx.member.role!=='teen'||ctx.teenId!==user.id)throw new AppError('Only the learner may submit responses.',403);
 const lesson=drivingLessons.find(l=>l.id===c.lessonId);if(!lesson)throw new AppError('Lesson unavailable.',404);
 const state=projection(ctx);const completed=new Set(state.lessonAttempts.filter(a=>a.completedAt).map(a=>a.lessonId));
 if(!lesson.prerequisites.every(id=>completed.has(id)))throw new AppError('Complete prerequisite lessons first.',409);
 let feedback='';let safe:boolean|undefined;
 if(c.scenarioId||c.choiceId){const choice=lesson.scenarios.find(s=>s.id===c.scenarioId)?.choices.find(x=>x.id===c.choiceId);if(!choice)throw new AppError('Invalid scenario choice.',400);feedback=choice.feedback;safe=choice.safe;}
 const at=new Date().toISOString();const previous=state.lessonAttempts.find(a=>a.lessonId===lesson.id);
 const attempt={...previous,lessonId:lesson.id,scenarioId:c.scenarioId||previous?.scenarioId,choiceId:c.choiceId||previous?.choiceId,safe:safe??previous?.safe,updatedAt:at,completedAt:c.complete?at:previous?.completedAt};
 state.lessonAttempts=[...state.lessonAttempts.filter(a=>a.lessonId!==lesson.id),attempt];
 put<Progress>('lesson_progress',{id:`lessons:${ctx.householdId}:${ctx.teenId}`,householdId:ctx.householdId,ownerId:ctx.teenId,attempts:state.lessonAttempts});
 audit(user.id,ctx.householdId,'lessons.submit','ALLOW','Own educational response validated; no licensing claim.');return {state,feedback};
})}
