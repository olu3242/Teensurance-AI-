import {NextResponse} from 'next/server';
import {z} from 'zod';
import {invitationCode} from '@/lib/codes';
import {createClient} from '@/lib/supabase/server';
const input=z.object({householdId:z.string().uuid(),role:z.enum(['teen','guardian']),days:z.number().int().min(1).max(30).default(7)});
export async function POST(request:Request){
 const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Invalid invitation request.'},{status:400});
 const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;if(!userId)return NextResponse.json({error:'Sign in required.'},{status:401});
 const expires=new Date(Date.now()+parsed.data.days*86400000).toISOString();
 for(let attempt=0;attempt<5;attempt++){const code=invitationCode();const {data,error}=await supabase.from('invitations').insert({household_id:parsed.data.householdId,code,intended_role:parsed.data.role,created_by:userId,expires_at:expires}).select('code,expires_at,intended_role').single();if(!error)return NextResponse.json({invitation:data});if(error.code!=='23505')return NextResponse.json({error:'Could not create invitation.'},{status:403});}
 return NextResponse.json({error:'Could not allocate a unique invitation code.'},{status:503});
}
