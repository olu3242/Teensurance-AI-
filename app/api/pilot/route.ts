import {errorResponse,json,requestUser} from '@/lib/platform/http';
import {readLegacyLearning} from '@/lib/platform/legacy-learning';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(request:Request){try{return json(readLegacyLearning(requestUser(request),Object.fromEntries(new URL(request.url).searchParams)))}catch(error){return errorResponse(error)}}
export function POST(){return json({error:'Legacy mutations are retired. Use the authenticated workspace.'},410)}
