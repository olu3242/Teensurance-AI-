'use client';
import {FormEvent,useState} from 'react';

type Msg={role:'assistant'|'user';text:string};

export function HelpChat({context='public'}:{context?:string}) {
 const [open,setOpen]=useState(false);
 const [input,setInput]=useState('');
 const [busy,setBusy]=useState(false);
 const [messages,setMessages]=useState<Msg[]>([{role:'assistant',text:"Hi — I’m T. I can help you find your next step, understand the app, or explain how family invites and driving logs work."}]);

 async function send(e:FormEvent){
  e.preventDefault();const q=input.trim();if(!q||busy)return;
  setMessages(m=>[...m,{role:'user',text:q}]);setInput('');setBusy(true);
  try{
   const response=await fetch('/api/help',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,context})});
   const data=await response.json();
   setMessages(m=>[...m,{role:'assistant',text:data.reply||'I could not answer that right now. Try the Journey page or ask a parent/guardian for help.'}]);
  }catch{
   setMessages(m=>[...m,{role:'assistant',text:'I could not reach the help service. Your saved driving data is not affected.'}]);
  }finally{setBusy(false)}
 }
 return <div className={`helpChat ${open?'isOpen':''}`}>
  {open&&<section className="helpPanel" aria-label="Teensurance help chat">
   <header><div><span>T / HELP</span><strong>Ask Teensurance</strong></div><button onClick={()=>setOpen(false)} aria-label="Close help">×</button></header>
   <div className="helpMessages" aria-live="polite">{messages.map((m,i)=><p key={i} className={m.role}>{m.text}</p>)}{busy&&<p className="assistant">Checking the safest next step…</p>}</div>
   <form onSubmit={send}><label className="srOnly" htmlFor="help-input">Ask a question</label><input id="help-input" value={input} onChange={e=>setInput(e.target.value)} placeholder="How do I log a drive?" maxLength={300}/><button disabled={busy||!input.trim()}>Send</button></form>
   <small>For safety, T does not provide in-drive chat, legal eligibility decisions, or insurance quotes.</small>
  </section>}
  <button className="helpLauncher" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>{open?'Close':'Ask T'} <span aria-hidden="true">{open?'×':'?'}</span></button>
 </div>;
}
