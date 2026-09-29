import {randomUUID} from 'node:crypto';
import {all,owned,put} from '../platform/db';
import {mastery} from './rules';
import type {LearningEvidence,GuardianReinforcement} from './types';
export async function learnerEvidence(householdId:string,teenId:string){return {learning:(await owned<LearningEvidence>('roadready_attempt',householdId,teenId)),guardian:(await all<GuardianReinforcement>('roadready_guardian',householdId)).filter(e=>e.teenId===teenId)}}
export async function recordLearning(input:Omit<LearningEvidence,'id'|'ownerId'|'kind'|'at'>){return (await put<LearningEvidence>('roadready_attempt',{...input,id:randomUUID(),ownerId:input.teenId,kind:'learning',at:new Date().toISOString()}))}
export async function projectMastery(householdId:string,teenId:string,conceptId:string){const e=(await learnerEvidence(householdId,teenId));const m=mastery(conceptId,e.learning,e.guardian);(await put('roadready_mastery',{id:`roadready:${householdId}:${teenId}:${conceptId}`,householdId,ownerId:teenId,teenId,...m,passportSection:conceptId.startsWith('CORE:hazard-')?'Hazard Awareness':'Road Knowledge & Awareness'}));return m}
