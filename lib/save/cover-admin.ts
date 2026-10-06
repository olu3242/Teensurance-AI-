import {randomUUID} from 'node:crypto';
import {all,put} from '@/lib/platform/db';
import {AppError} from '@/lib/platform/auth';
import {requireAdmin} from '@/lib/platform/admin';
import type {User} from '@/lib/platform/types';
import type {CoverHandoff} from './cover-handoff';

export type CoverIncidentStatus='open'|'acknowledged'|'resolved';
export type CoverIncidentSeverity='info'|'warning'|'critical';

export type CoverIncident={
 id:string;
 householdId:string;
 ownerId:string;
 handoffId:string;
 category:'stuck_handoff'|'provider_failure'|'licensed_channel_failure'|'manual_review';
 severity:CoverIncidentSeverity;
 status:CoverIncidentStatus;
 summary:string;
 note?:string;
 createdAt:string;
 updatedAt:string;
 acknowledgedBy?:string;
 resolvedBy?:string;
};

const now=()=>new Date().toISOString();

export async function coverAdminOverview(user:User,householdId?:string){
 requireAdmin(user);
 const handoffs=await all<CoverHandoff>('save_cover_handoff',householdId);
 const incidents=await all<CoverIncident>('save_cover_incident',householdId);
 const current=Date.now();

 const derived=handoffs.map(h=>{
  const ageHours=Math.max(0,(current-Date.parse(h.updatedAt))/3600000);
  const stuck=h.status==='prepared'&&ageHours>=24;
  const related=incidents.filter(i=>i.handoffId===h.id).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  return {
   id:h.id,
   householdId:h.householdId,
   ownerId:h.ownerId,
   quoteId:h.quoteId,
   provider:h.provider,
   annualPremium:h.annualPremium,
   coverageFingerprint:h.coverageFingerprint,
   status:h.status,
   createdAt:h.createdAt,
   updatedAt:h.updatedAt,
   ageHours:Math.round(ageHours),
   stuck,
   openIncident:related.find(i=>i.status!=='resolved'),
   incidentHistory:related
  };
 }).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));

 return {
  householdId,
  handoffs:derived,
  incidents:incidents.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),
  summary:{
   total:handoffs.length,
   prepared:handoffs.filter(h=>h.status==='prepared').length,
   sentToLicensedChannel:handoffs.filter(h=>h.status==='sent_to_licensed_channel').length,
   completed:handoffs.filter(h=>h.status==='completed').length,
   declined:handoffs.filter(h=>h.status==='declined').length,
   stuck:derived.filter(h=>h.stuck).length,
   openIncidents:incidents.filter(i=>i.status!=='resolved').length
  },
  boundary:'Operational triage only. Platform administrators cannot bind, cancel, pay for, accept, decline, or otherwise make insurance coverage decisions for the guardian.'
 };
}

export async function createCoverIncident(user:User,input:{
 householdId:string;
 handoffId:string;
 category:CoverIncident['category'];
 severity:CoverIncidentSeverity;
 summary:string;
 note?:string;
}){
 requireAdmin(user);
 const handoff=(await all<CoverHandoff>('save_cover_handoff',input.householdId)).find(h=>h.id===input.handoffId);
 if(!handoff)throw new AppError('COVER handoff not found.',404);
 if(input.summary.trim().length<3)throw new AppError('Incident summary is required.',400);
 const existing=(await all<CoverIncident>('save_cover_incident',input.householdId)).find(i=>i.handoffId===input.handoffId&&i.category===input.category&&i.status!=='resolved');
 if(existing)return existing;
 const at=now();
 const incident:CoverIncident={
  id:randomUUID(),householdId:input.householdId,ownerId:user.id,handoffId:input.handoffId,
  category:input.category,severity:input.severity,status:'open',
  summary:input.summary.trim(),note:input.note?.trim()||undefined,createdAt:at,updatedAt:at
 };
 await put('save_cover_incident',incident);
 return incident;
}

export async function updateCoverIncident(user:User,input:{
 householdId:string;
 incidentId:string;
 action:'acknowledge'|'resolve';
 note?:string;
}){
 requireAdmin(user);
 const incident=(await all<CoverIncident>('save_cover_incident',input.householdId)).find(i=>i.id===input.incidentId);
 if(!incident)throw new AppError('COVER incident not found.',404);
 if(input.action==='acknowledge'&&incident.status==='resolved')throw new AppError('Resolved incident cannot be acknowledged again.',409);
 const at=now();
 const updated:CoverIncident={
  ...incident,
  status:input.action==='resolve'?'resolved':'acknowledged',
  note:input.note?.trim()||incident.note,
  updatedAt:at,
  ...(input.action==='resolve'?{resolvedBy:user.id}:{acknowledgedBy:user.id})
 };
 await put('save_cover_incident',updated);
 return updated;
}
