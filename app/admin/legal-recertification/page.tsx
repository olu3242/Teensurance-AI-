'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';
type Impact={id:string;jurisdiction:string;ruleId:string;version:string;status:string;reasons:string[];affected:string[];detectedAt:string;note:string};
export default function LegalRecertification(){
 const [items,setItems]=useState<Impact[]>([]);const [message,setMessage]=useState('');
 async function load(){const r=await fetch('/api/admin/legal-recertification',{cache:'no-store'});const b=await r.json();if(!r.ok)throw new Error(b.error);setItems(b.items)}
 useEffect(()=>{load().catch(e=>setMessage(e.message))},[]);
 async function scan(){const r=await fetch('/api/admin/legal-recertification',{method:'POST'});const b=await r.json();if(!r.ok)throw new Error(b.error);setItems(b.items);setMessage('Legal-source recertification scan completed.')}
 return <main className="dashboardPage"><h1>Legal change recertification</h1><p>Source and validity changes fail closed before stale state-law guidance can continue through the product.</p><button onClick={()=>void scan().catch(e=>setMessage(e.message))}>Run recertification scan</button><p role="status">{message}</p>{items.filter(x=>x.status==='open').map(item=><section className="dashCard" key={item.id}><span>{item.jurisdiction} / RECERTIFICATION REQUIRED</span><h2>{item.ruleId} · {item.version}</h2><p>Detected {item.detectedAt.slice(0,10)}</p><p>Reasons: {item.reasons.join(', ')}</p><p>Affected: {item.affected.join(', ')}</p><p>{item.note}</p></section>)}{!items.some(x=>x.status==='open')&&<section className="dashCard"><h2>No open recertification impacts</h2><p>This does not replace scheduled source review or human legal review.</p></section>}<Link href="/admin/legal-sources">Source ingestion</Link> · <Link href="/admin/legal-rules">Legal rule governance</Link></main>
}
