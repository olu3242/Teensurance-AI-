import {z} from 'zod';
import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {coverAdminOverview,createCoverIncident,updateCoverIncident} from '@/lib/save/cover-admin';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const command=z.discriminatedUnion('action',[
 z.object({
  action:z.literal('incident.create'),
  householdId:z.string().min(1),
  handoffId:z.string().min(1),
  category:z.enum(['stuck_handoff','provider_failure','licensed_channel_failure','manual_review']),
  severity:z.enum(['info','warning','critical']),
  summary:z.string().min(3).max(300),
  note:z.string().max(1000).optional()
 }),
 z.object({
  action:z.literal('incident.acknowledge'),
  householdId:z.string().min(1),
  incidentId:z.string().min(1),
  note:z.string().max(1000).optional()
 }),
 z.object({
  action:z.literal('incident.resolve'),
  householdId:z.string().min(1),
  incidentId:z.string().min(1),
  note:z.string().max(1000).optional()
 })
]);

export async function GET(request:Request){
 try{
  const user=await requestUser(request);
  const householdId=new URL(request.url).searchParams.get('household')||undefined;
  return json(await coverAdminOverview(user,householdId));
 }catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
 try{
  sameOrigin(request);
  const user=await requestUser(request);
  const parsed=command.safeParse(await body(request));
  if(!parsed.success)return json({error:parsed.error.issues[0]?.message||'Invalid COVER admin request.'},400);
  const c=parsed.data;
  if(c.action==='incident.create')return json(await createCoverIncident(user,c));
  return json(await updateCoverIncident(user,{
   householdId:c.householdId,
   incidentId:c.incidentId,
   action:c.action==='incident.resolve'?'resolve':'acknowledge',
   note:c.note
  }));
 }catch(error){return errorResponse(error)}
}
