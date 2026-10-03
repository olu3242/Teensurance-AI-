import {errorResponse,json,requestUser} from '@/lib/platform/http';import {operations} from '@/lib/platform/operations';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{return json(await operations(await requestUser(r)))}catch(e){return errorResponse(e)}}
