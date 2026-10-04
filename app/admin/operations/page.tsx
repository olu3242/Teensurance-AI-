'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';

type InsuranceOps={health:{runtimeTraces:number;eventChains:number;scheduled:number;retries:number;deadLetters:number;partialChains:number};byAgent:Record<string,number>;byWorkflow:Record<string,number>;failures:Array<{id:string;triggerId:string;correlationId:string;attempt:number;status:string;error:string;createdAt:string}>;deadLetters:Array<{id:string;action:string;householdId:string;attempts?:number;lastError?:string}>};
type PilotOps={feedback:Array<{id:string;item_id:string;category:string;note:string;status:string}>};

export default function Operations(){
 const [data,setData]=useState<PilotOps>();const [insurance,setInsurance]=useState<InsuranceOps>();const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 async function refresh(){const [p,i]=await Promise.all([fetch('/api/admin/operations'),fetch('/api/admin/insurance-operations')]);const pb=await p.json();const ib=await i.json();if(!p.ok)throw new Error(pb.error);if(!i.ok)throw new Error(ib.error);setData(pb);setInsurance(ib)}
 useEffect(()=>{refresh().catch(e=>setMessage(e instanceof Error?e.message:'Unable to load operations.'))},[]);
 async function replay(triggerId:string){setBusy(true);try{const r=await fetch('/api/admin/insurance-operations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'replay',triggerId})});const b=await r.json();if(!r.ok)throw new Error(b.error);setMessage('Dead-letter trigger queued for governed replay.');await refresh()}catch(e){setMessage(e instanceof Error?e.message:'Replay failed.')}finally{setBusy(false)}}
 return <main style={{maxWidth:1000,margin:'auto',padding:24}}>
  <h1>Teensurance operations</h1><p>Authorized administrators only. Insurance operations are observability and recovery controls; they do not permit administrators or AI agents to bind coverage.</p><p role="status">{message}</p>
  {insurance&&<section><h2>AI-native insurance runtime</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12}}>{Object.entries(insurance.health).map(([k,v])=><div key={k} style={{border:'1px solid #ddd',padding:12,borderRadius:8}}><strong>{v}</strong><div>{k}</div></div>)}</div><h3>Agent activity</h3><pre>{JSON.stringify(insurance.byAgent,null,2)}</pre><h3>Workflow activity</h3><pre>{JSON.stringify(insurance.byWorkflow,null,2)}</pre><h3>Dead-letter queue</h3>{insurance.deadLetters.length===0?<p>No dead-letter triggers.</p>:insurance.deadLetters.map(t=><div key={t.id} style={{border:'1px solid #ddd',padding:12,marginBottom:8}}><strong>{t.action}</strong><p>{t.lastError||'No error detail'} · attempts {t.attempts||0}</p><button disabled={busy} onClick={()=>void replay(t.id)}>Replay through GUARD</button></div>)}<h3>Recent runtime failures</h3><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(insurance.failures,null,2)}</pre></section>}
  {data&&<section><h2>Pilot/content operations</h2><p>{data.feedback.length} recent content feedback item(s).</p></section>}
  <Link href="/admin/scout">Content review</Link>
 </main>
}
