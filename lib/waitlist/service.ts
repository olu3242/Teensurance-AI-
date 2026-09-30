import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {db,transaction} from '@/lib/platform/db';
import {AppError} from '@/lib/platform/auth';
import {recordFailure} from '@/lib/platform/operations';
import {requireAdmin} from '@/lib/platform/admin';
import type {User} from '@/lib/platform/types';
import {waitlistStatuses,type WaitlistEntry,type WaitlistStatus} from './types';
import {appUrl,queueEmail} from '@/lib/notifications/email';

const signupSchema=z.object({email:z.string().trim().email().max(254),parentName:z.string().trim().min(2).max(100),teenCount:z.coerce.number().int().min(1).max(10),region:z.string().trim().min(2).max(80),referralSource:z.string().trim().max(80).optional().default(''),consent:z.literal(true),website:z.string().max(0).optional().default('')});
const updateSchema=z.object({id:z.string().uuid(),status:z.enum(waitlistStatuses),notes:z.string().trim().max(1000).optional().default('')});
const allowed:Record<WaitlistStatus,WaitlistStatus[]>={NEW:['CONTACTED','DECLINED'],CONTACTED:['INVITED','DECLINED'],INVITED:['ENROLLED','DECLINED'],ENROLLED:[],DECLINED:[]};
function rowToEntry(row:Record<string,unknown>):WaitlistEntry{return {id:String(row.id),email:String(row.email),parentName:String(row.parent_name),teenCount:Number(row.teen_count),region:String(row.region),referralSource:String(row.referral_source||''),status:String(row.status) as WaitlistStatus,notes:String(row.notes||''),createdAt:String(row.created_at),updatedAt:String(row.updated_at)}}
export async function joinWaitlist(input:unknown){const parsed=signupSchema.safeParse(input);if(!parsed.success)throw new AppError('Please check the waitlist form and try again.',400);const value=parsed.data;const email=value.email.toLowerCase();let created=false;const result=await transaction(async()=>{const existing=await db().prepare('SELECT id FROM waitlist_entries WHERE email=?').get(email);if(existing)return {ok:true as const,status:'received' as const};const now=new Date().toISOString();await db().prepare('INSERT INTO waitlist_entries(id,email,parent_name,teen_count,region,referral_source,status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),email,value.parentName,value.teenCount,value.region,value.referralSource,'NEW','',now,now);created=true;return {ok:true as const,status:'received' as const}});if(created){
 try{
  await queueEmail({event:'waitlist.joined',to:email,name:value.parentName,actionUrl:appUrl('/waitlist')});
 }catch(error){
  console.error(JSON.stringify({event:'waitlist.email_queue_failed',emailDomain:email.split('@')[1]||'unknown',message:error instanceof Error?error.message:'unknown'}));
  await recordFailure('PERSISTENCE_FAILURE').catch(()=>{});
 }
}
return result}
export async function listWaitlist(user:User){requireAdmin(user);const rows=await db().prepare('SELECT id,email,parent_name,teen_count,region,referral_source,status,notes,created_at,updated_at FROM waitlist_entries ORDER BY created_at DESC').all();return rows.map(rowToEntry)}
export async function updateWaitlist(user:User,input:unknown){requireAdmin(user);const parsed=updateSchema.safeParse(input);if(!parsed.success)throw new AppError('Invalid waitlist update.',400);return transaction(async()=>{const row=await db().prepare('SELECT id,email,parent_name,teen_count,region,referral_source,status,notes,created_at,updated_at FROM waitlist_entries WHERE id=?').get(parsed.data.id);if(!row)throw new AppError('Waitlist entry not found.',404);const current=rowToEntry(row);if(current.status!==parsed.data.status&&!allowed[current.status].includes(parsed.data.status))throw new AppError('Invalid waitlist status transition.',409);const now=new Date().toISOString();await db().prepare('UPDATE waitlist_entries SET status=?,notes=?,updated_at=? WHERE id=?').run(parsed.data.status,parsed.data.notes,now,current.id);if(current.status!==parsed.data.status)await db().prepare('INSERT INTO waitlist_events(id,entry_id,actor_id,from_status,to_status,note,at) VALUES(?,?,?,?,?,?,?)').run(randomUUID(),current.id,user.id,current.status,parsed.data.status,parsed.data.notes,now);const updated=await db().prepare('SELECT id,email,parent_name,teen_count,region,referral_source,status,notes,created_at,updated_at FROM waitlist_entries WHERE id=?').get(current.id);return rowToEntry(updated!)})}
