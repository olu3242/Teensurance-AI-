import {randomUUID} from 'node:crypto';
import {db} from '@/lib/platform/db';

export type EmailEvent=
 |'waitlist.joined'
 |'account.created'
 |'family.invited'
 |'drive.awaiting_review'
 |'drive.verified'
 |'milestone.completed'
 |'reminder.created'
 |'pilot.invited'
 |'pilot.activated';

type TemplateInput={
 event:EmailEvent;
 to:string;
 name?:string;
 teenName?:string;
 milestone?:string;
 actionUrl?:string;
 detail?:string;
};

export const appUrl=(path='/')=>{const base=(process.env.APP_URL||process.env.NEXT_PUBLIC_APP_URL||'').replace(/\/$/,'');return base?base+path:undefined};

const esc=(value='')=>value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));

function base(title:string,body:string,cta?:{label:string;url:string}){
 const ctaHtml=cta?'<p style="margin:28px 0 0"><a href="'+esc(cta.url)+'" style="display:inline-block;background:#ceff59;color:#071321;text-decoration:none;font-weight:700;padding:14px 20px">'+esc(cta.label)+'</a></p>':'';
 return {
  subject:title,
  text:title+'\n\n'+body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()+(cta?'\n\n'+cta.label+': '+cta.url:'')+'\n\nTeensurance · Safety before speed',
  html:'<!doctype html><html><body style="margin:0;background:#fafbff;color:#071321;font-family:Arial,Helvetica,sans-serif"><table width="100%" role="presentation" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table width="600" role="presentation" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #d7deea"><tr><td style="padding:28px"><div style="display:flex;align-items:center;gap:12px"><span style="display:inline-block;width:30px;height:31px;background:#ceff59"></span><strong style="font-size:18px">TEENSURANCE</strong></div><p style="margin:8px 0 0;font-size:10px;letter-spacing:2px;color:#5b6580">SAFETY BEFORE SPEED</p></td></tr><tr><td style="padding:4px 28px 32px"><h1 style="font-size:30px;line-height:1.05;margin:12px 0 18px">'+esc(title)+'</h1><div style="font-size:16px;line-height:1.6;color:#354057">'+body+'</div>'+ctaHtml+'</td></tr><tr><td style="padding:22px 28px;background:#0a1927;color:#bdc8d8;font-size:12px;line-height:1.5">Teensurance helps families organize learning, supervised practice and readiness evidence. Licensing and insurance decisions remain with official or licensed sources.</td></tr></table></td></tr></table></body></html>'
 };
}

export function emailTemplate(input:TemplateInput){
 const name=esc(input.name||'there');const teen=esc(input.teenName||'your driver');const detail=esc(input.detail||'');
 const cta=input.actionUrl?{label:'Open Teensurance',url:input.actionUrl}:undefined;
 switch(input.event){
  case 'waitlist.joined':return base('You’re on the Teensurance waitlist','<p>Hi '+name+',</p><p>Thanks for joining the Teensurance early-access list. We’ll email you when a relevant pilot opening becomes available.</p><p>Your waitlist position does not determine insurance eligibility, pricing, licensing readiness or driving risk.</p>',input.actionUrl?{label:'View Teensurance',url:input.actionUrl}:undefined);
  case 'account.created':return base('Welcome to Teensurance','<p>Hi '+name+',</p><p>Your Teensurance account is ready. Your next step is to connect your family and complete the appropriate driver profile.</p><p>Teensurance is designed for parked planning, family review and safer supervised practice.</p>',input.actionUrl?{label:'Open your journey',url:input.actionUrl}:undefined);
  case 'family.invited':return base('You’ve been invited to a Teensurance family','<p>Hi '+name+',</p><p>A family has invited you to join their Teensurance driving journey. Use the private invitation supplied by the family to accept the correct role.</p>',input.actionUrl?{label:'Accept invitation',url:input.actionUrl}:undefined);
  case 'drive.awaiting_review':return base('A practice drive is ready for review','<p>Hi '+name+',</p><p>'+teen+' submitted a supervised practice session for review.</p><p>Please verify the session only if you supervised it and the recorded details are accurate.</p>'+(detail?'<p>'+detail+'</p>':''),input.actionUrl?{label:'Review practice',url:input.actionUrl}:undefined);
  case 'drive.verified':return base('Practice session verified','<p>Hi '+name+',</p><p>Your supervised practice session has been verified and now contributes to your family’s practice record.</p>'+(detail?'<p>'+detail+'</p>':''),input.actionUrl?{label:'View progress',url:input.actionUrl}:undefined);
  case 'milestone.completed':return base('Milestone evidence accepted','<p>Hi '+name+',</p><p>Evidence for <strong>'+esc(input.milestone||'a journey milestone')+'</strong> has been accepted in your Teensurance journey.</p><p>This records family-reviewed evidence; it does not create an official licensing or insurance decision.</p>',input.actionUrl?{label:'See what’s next',url:input.actionUrl}:undefined);
  case 'reminder.created':return base('A Teensurance reminder was scheduled','<p>Hi '+name+',</p><p>A reminder was added to your driving journey.</p>'+(detail?'<p>'+detail+'</p>':''),input.actionUrl?{label:'Open reminders',url:input.actionUrl}:undefined);
  case 'pilot.invited':return base('Your Teensurance pilot invitation','<p>Hi '+name+',</p><p>You’ve been invited to a Teensurance pilot. Follow the approved invitation process to complete family onboarding.</p>',input.actionUrl?{label:'Start pilot onboarding',url:input.actionUrl}:undefined);
  case 'pilot.activated':return base('Your Teensurance pilot is active','<p>Hi '+name+',</p><p>Your family pilot is active. Continue with parked learning, supervised practice and family review.</p>',cta);
 }
}

export async function queueEmail(input:TemplateInput){
 const template=emailTemplate(input);const now=new Date().toISOString();
 await db().prepare('INSERT INTO email_outbox(id,event_type,recipient,subject,text_body,html_body,status,attempts,created_at,updated_at,last_error) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),input.event,input.to.toLowerCase().trim(),template.subject,template.text,template.html,'PENDING',0,now,now,'');
}

export async function pendingEmails(limit=25){
 return db().prepare("SELECT * FROM email_outbox WHERE status='PENDING' ORDER BY created_at ASC LIMIT ?").all(limit);
}

export async function markEmailSent(id:string){
 await db().prepare("UPDATE email_outbox SET status='SENT',attempts=attempts+1,updated_at=?,last_error='' WHERE id=?").run(new Date().toISOString(),id);
}
export async function markEmailFailed(id:string,error:string){
 await db().prepare("UPDATE email_outbox SET status='PENDING',attempts=attempts+1,updated_at=?,last_error=? WHERE id=?").run(new Date().toISOString(),error.slice(0,500),id);
}
