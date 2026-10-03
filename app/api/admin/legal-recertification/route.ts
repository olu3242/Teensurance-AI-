import {errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {inspectLegalRecertification,scanLegalChanges} from '@/lib/platform/legal-change-recertification';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{return json({items:await inspectLegalRecertification(await requestUser(r))})}catch(e){return errorResponse(e)}}
export async function POST(r:Request){try{sameOrigin(r);return json({items:await scanLegalChanges(await requestUser(r))})}catch(e){return errorResponse(e)}}
