import {db} from '@/lib/platform/db';import {json} from '@/lib/platform/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{await db().prepare('SELECT 1 AS healthy').get();return json({status:'ok'})}catch{return json({status:'unavailable'},503)}}
