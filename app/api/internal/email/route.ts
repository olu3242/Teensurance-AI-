import {NextResponse} from 'next/server';
import {drainEmailOutbox} from '@/lib/notifications/delivery';

export const runtime='nodejs';export const dynamic='force-dynamic';

export async function POST(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get('authorization')!=='Bearer '+secret)return NextResponse.json({error:'Unauthorized'},{status:401});
 const result=await drainEmailOutbox();
 return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
}

export async function GET(request:Request){return POST(request)}
