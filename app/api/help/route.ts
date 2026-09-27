import {NextResponse} from 'next/server';
import {z} from 'zod';

const input=z.object({message:z.string().trim().min(1).max(300),context:z.string().max(40).optional()});
const answers=[
 {keys:['invite','invitation','join family'],reply:'A guardian creates an invitation code for a household. The invited person opens Join family, enters the INV- code, signs in, and then completes the secure membership flow. Invitation codes grant household access only after validation; referral codes do not.'},
 {keys:['referral','refer'],reply:'Referral codes begin with REF-. They record who introduced a new user to Teensurance, but they never grant household access, change a role, or affect licensing or insurance status.'},
 {keys:['log','drive','hours','practice'],reply:'After the vehicle is safely parked, open Log a drive. Record the date, practice minutes, focus area and supervisor. The entry stays pending until family review; logged time by itself does not prove licensing eligibility.'},
 {keys:['parent','guardian','verify'],reply:'Parents and guardians use Family review to check pending practice entries and shared progress. Production access will use authenticated household relationships rather than the local pilot role switch.'},
 {keys:['passport','readiness'],reply:'The Safety & Readiness Passport summarizes evidence your family has recorded. It is not a licensing score, insurance score, or official eligibility decision.'},
 {keys:['license','permit','dmv','requirement','legal'],reply:'Licensing and permit rules vary by jurisdiction. Teensurance can organize your journey, but you should confirm legal requirements with the official licensing authority for your location before making a decision.'},
 {keys:['insurance','quote','coverage','cover'],reply:'COVER helps families prepare for insurance conversations. The MVP does not quote, bind, underwrite, rank insurers, or decide insurance eligibility.'},
 {keys:['drive mode','driving now','moving'],reply:'If you are driving or the vehicle is moving, do not use the chat. Put the phone away. Teensurance is designed for preparation before a drive and logging or reflection only after you are safely parked.'},
 {keys:['google','login','sign in','auth'],reply:'Use Log in and choose Continue with Google. Google sign-in becomes live once the dedicated Teensurance Supabase project and Google OAuth provider are activated.'},
 {keys:['next','start','journey'],reply:'Start with Journey. VIBE shows the next safe step based on the evidence recorded in the MVP. Prepare while parked, drive without app interaction, then log and reflect afterward.'}
];
export async function POST(request:Request){
 const parsed=input.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Ask a short Teensurance question.'},{status:400});
 const q=parsed.data.message.toLowerCase();
 const match=answers.find(item=>item.keys.some(key=>q.includes(key)));
 return NextResponse.json({reply:match?.reply||'I can help with the Journey, practice logging, family review, invitations, referrals, Google sign-in, the Readiness Passport, or Teensurance safety rules. For legal licensing requirements or insurance decisions, I’ll point you to the appropriate official or licensed source.'});
}
