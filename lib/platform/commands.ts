import {z} from 'zod';
const id=z.string().uuid();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(`${v}T00:00:00Z`);return !isNaN(+d)&&d.toISOString().slice(0,10)===v&&v<=new Date().toISOString().slice(0,10)},'Use a valid past date.');
const text=z.string().trim().min(2).max(120);
const note=z.string().trim().max(500);
const minutes=z.number().int().min(1).max(240);
const night=z.number().int().min(0).max(240);
const weather=z.number().int().min(0).max(240);
const url=z.union([z.literal(''),z.string().url().max(500).refine(v=>v.startsWith('https://'),'Use an HTTPS source URL.')]);
export const command=z.discriminatedUnion('action',[
 z.object({action:z.literal('household.create'),name:text,adultAttestation:z.literal(true)}).strict(),
 z.object({action:z.literal('invite.create'),householdId:id,role:z.enum(['teen','guardian','supervisor']),teenId:id.optional()}).strict(),
 z.object({action:z.literal('invite.accept'),token:z.string().min(32).max(100),adultAttestation:z.boolean().optional()}).strict(),
 z.object({action:z.literal('profile.save'),householdId:id,teenId:id,name:text,birthDate:date,jurisdiction:z.enum(['TX','US-TX','PA','US-PA','OTHER']),stage:z.enum(['pre-permit','permit','licensed']),goalMinutes:z.number().int().min(60).max(12000),permitDate:z.union([date,z.literal('')]),suspensionDays:z.number().int().min(0).max(3650)}).strict(),
 z.object({action:z.literal('consent.set'),householdId:id,teenId:id,granted:z.boolean()}).strict(),
 z.object({action:z.literal('sharing.set'),householdId:id,teenId:id,granted:z.boolean()}).strict(),
 z.object({action:z.literal('relationship.revoke'),householdId:id,id}).strict(),
 z.object({action:z.literal('drive.start'),householdId:id,teenId:id,supervisorId:id,skill:text,supervisorEligible:z.literal(true)}).strict(),
 z.object({action:z.literal('drive.end'),householdId:id,id,parked:z.literal(true)}).strict(),
 z.object({action:z.literal('drive.cancel'),householdId:id,id,parked:z.literal(true)}).strict(),
 z.object({action:z.literal('drive.submit'),householdId:id,id,minutes,nightMinutes:night,weatherMinutes:weather.default(0),note}).strict(),
 z.object({action:z.literal('drive.manual'),householdId:id,teenId:id,supervisorId:id,skill:text,startedAt:z.string().datetime(),minutes,nightMinutes:night,weatherMinutes:weather.default(0),note,supervisorEligible:z.literal(true)}).strict(),
 z.object({action:z.literal('drive.review'),householdId:id,id,decision:z.enum(['confirm','dispute']),reason:note}).strict(),
 z.object({action:z.literal('drive.correct'),householdId:id,id,minutes,nightMinutes:night,weatherMinutes:weather.default(0),reason:text}).strict(),
 z.object({action:z.literal('evidence.add'),householdId:id,teenId:id,milestone:z.enum(['prepare','learn','license','coverage','education','impact','test','documents']),description:text,sourceUrl:url}).strict(),
 z.object({action:z.literal('evidence.review'),householdId:id,id,accepted:z.boolean()}).strict(),
 z.object({action:z.literal('reminder.create'),householdId:id,teenId:id,title:text,dueAt:z.string().datetime()}).strict(),
 z.object({action:z.literal('reminder.update'),householdId:id,id,done:z.boolean(),enabled:z.boolean()}).strict(),
 z.object({action:z.literal('agent.explain'),householdId:id,teenId:id}).strict(),
]);
export type Command=z.infer<typeof command>;
