import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {all,put} from './db';
import {AppError} from './auth';
import {requireReviewer} from './admin';
import type {User} from './types';
import type {LegalRecertificationImpact,LegalChangeReason} from './legal-change-recertification';

export type LegalAlertSeverity='critical'|'high'|'medium';
export type LegalEscalationStatus='open'|'acknowledged'|'resolved';

export type LegalEscalation={
 id:string;householdId:string;ownerId:string;impactId:string;jurisdiction:string;ruleId:string;version:string;
 severity:LegalAlertSeverity;status:LegalEscalationStatus;reasons:LegalChangeReason[];affected:string[];
 assignedTo:string;dueAt:string;createdAt:string;updatedAt:string;acknowledgedAt?:string;resolvedAt?:string;
 note:string
};

export function severityForImpact(impact:LegalRecertificationImpact):LegalAlertSeverity{
 if(impact.reasons.some(r=>['source_missing','source_rejected'].includes(r)))return 'critical';
 if(impact.reasons.some(r=>['source_superseded','source_expired'].includes(r)))return 'high';
 return 'medium';
}

export function dueAtForSeverity(severity:LegalAlertSeverity,now=new Date()){
 const hours=severity==='critical'?24:severity==='high'?72:168;
 return new Date(now.getTime()+hours*3600000).toISOString();
}

export async function upsertLegalEscalations(impacts:LegalRecertificationImpact[],now=new Date()){
 const existing=await all<LegalEscalation>('legal_escalation');
 const output:LegalEscalation[]=[];
 for(const impact of impacts.filter(i=>i.status==='open')){
  const old=existing.find(a=>a.impactId===impact.id&&a.status!=='resolved');
  const severity=severityForImpact(impact);
  const alert:LegalEscalation={
   id:old?.id||randomUUID(),householdId:'',ownerId:'system:legal-escalation',impactId:impact.id,
   jurisdiction:impact.jurisdiction,ruleId:impact.ruleId,version:impact.version,severity,status:old?.status||'open',
   reasons:impact.reasons,affected:[...impact.affected],assignedTo:old?.assignedTo||'legal-reviewer',
   dueAt:old?.dueAt||dueAtForSeverity(severity,now),createdAt:old?.createdAt||now.toISOString(),updatedAt:now.toISOString(),
   acknowledgedAt:old?.acknowledgedAt,resolvedAt:old?.resolvedAt,note:impact.note
  };
  await put('legal_escalation',alert);output.push(alert);
 }
 return output;
}

const transition=z.object({id:z.string().uuid(),action:z.enum(['acknowledge','resolve']),note:z.string().trim().min(5).max(1000)}).strict();
export async function transitionLegalEscalation(user:User,raw:unknown){
 requireReviewer(user);const parsed=transition.safeParse(raw);if(!parsed.success)throw new AppError('Invalid legal escalation transition.',400);
 const alerts=await all<LegalEscalation>('legal_escalation');const alert=alerts.find(a=>a.id===parsed.data.id);if(!alert)throw new AppError('Legal escalation not found.',404);
 if(parsed.data.action==='acknowledge'&&alert.status!=='open')throw new AppError('Only open escalations may be acknowledged.',409);
 if(parsed.data.action==='resolve'&&alert.status==='resolved')throw new AppError('Escalation is already resolved.',409);
 const now=new Date().toISOString();
 return put('legal_escalation',{...alert,status:parsed.data.action==='acknowledge'?'acknowledged' as const:'resolved' as const,ownerId:user.id,updatedAt:now,acknowledgedAt:parsed.data.action==='acknowledge'?now:alert.acknowledgedAt,resolvedAt:parsed.data.action==='resolve'?now:alert.resolvedAt,note:parsed.data.note});
}

export async function inspectLegalEscalations(user:User){
 requireReviewer(user);const alerts=await all<LegalEscalation>('legal_escalation');
 return alerts.sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.jurisdiction.localeCompare(b.jurisdiction));
}
