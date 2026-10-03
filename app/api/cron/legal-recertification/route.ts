import {NextResponse} from 'next/server';
import {runScheduledLegalRecertification} from '@/lib/platform/legal-recertification-scheduler';
export const runtime='nodejs';export const dynamic='force-dynamic';

function authorized(r:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret)return false;
 return r.headers.get('authorization')===`Bearer ${secret}`;
}
export async function GET(r:Request){
 if(!authorized(r))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json({ok:true,result:await runScheduledLegalRecertification()})}
 catch(error){console.error('legal recertification cron failed',error);return NextResponse.json({ok:false,error:'Legal recertification scan failed.'},{status:500})}
}
