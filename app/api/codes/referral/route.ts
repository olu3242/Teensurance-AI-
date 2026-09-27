import {NextResponse} from 'next/server';
import {referralCode} from '@/lib/codes';
import {createClient} from '@/lib/supabase/server';
export async function POST(){
 const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;if(!userId)return NextResponse.json({error:'Sign in required.'},{status:401});
 const existing=await supabase.from('referral_codes').select('code').eq('owner_user_id',userId).eq('active',true).maybeSingle();if(existing.data)return NextResponse.json({referral:existing.data});
 for(let attempt=0;attempt<5;attempt++){const code=referralCode();const {data,error}=await supabase.from('referral_codes').insert({owner_user_id:userId,code}).select('code').single();if(!error)return NextResponse.json({referral:data});if(error.code!=='23505')return NextResponse.json({error:'Could not create referral code.'},{status:403});}
 return NextResponse.json({error:'Could not allocate a unique referral code.'},{status:503});
}
