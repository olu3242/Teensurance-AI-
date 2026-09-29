import {markEmailFailed,markEmailSent,pendingEmails} from './email';

type OutboxRow={id:string;recipient:string;subject:string;text_body:string;html_body:string;attempts:number};

async function send(row:OutboxRow){
 const key=process.env.RESEND_API_KEY;
 const from=process.env.EMAIL_FROM;
 if(!key||!from)throw new Error('Transactional email provider is not configured.');
 const response=await fetch('https://api.resend.com/emails',{
  method:'POST',
  headers:{authorization:'Bearer '+key,'content-type':'application/json'},
  body:JSON.stringify({from,to:[row.recipient],subject:row.subject,text:row.text_body,html:row.html_body})
 });
 if(!response.ok)throw new Error('Email provider rejected delivery with status '+response.status);
}

export async function drainEmailOutbox(limit=20){
 const rows=await pendingEmails(limit) as unknown as OutboxRow[];
 let sent=0,failed=0;
 for(const row of rows){
  if(Number(row.attempts)>=5)continue;
  try{await send(row);await markEmailSent(row.id);sent++}
  catch(error){await markEmailFailed(row.id,error instanceof Error?error.message:'Unknown delivery error');failed++}
 }
 return {processed:rows.length,sent,failed};
}
