'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {BrandLogo} from '@/components/BrandLogo';

type Incident={
 id:string;householdId:string;handoffId:string;category:string;severity:string;status:string;
 summary:string;note?:string;createdAt:string;updatedAt:string;
};
type Handoff={
 id:string;householdId:string;provider:string;annualPremium:number;status:string;updatedAt:string;
 ageHours:number;stuck:boolean;openIncident?:Incident;
};
type Data={
 householdId?:string;
 handoffs:Handoff[];
 incidents:Incident[];
 summary:{total:number;prepared:number;sentToLicensedChannel:number;completed:number;declined:number;stuck:number;openIncidents:number};
 boundary:string;
};

async function readJson(r:Response){const b=await r.json();if(!r.ok)throw new Error(b.error||'Request failed.');return b}

export default function CoverAdminPage(){
 const [data,setData]=useState<Data>();
 const [message,setMessage]=useState('');

 async function refresh(){
  try{setData(await readJson(await fetch('/api/admin/cover',{cache:'no-store'})))}catch(e){setMessage(e instanceof Error?e.message:'Unable to load COVER operations.')}
 }
 useEffect(()=>{refresh()},[]);

 async function act(payload:unknown){
  try{
   await readJson(await fetch('/api/admin/cover',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}));
   setMessage('COVER incident updated.');
   await refresh();
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to update COVER incident.')}
 }

 return <main className="dashboardPage">
  <header className="dashboardHeader"><BrandLogo/></header>
  <p><Link href="/admin">← Platform operations</Link> · <Link href="/admin/save">SAVE operations</Link></p>
  <h1>COVER operations</h1>
  <p>Operational triage only. Platform administrators cannot bind, cancel, pay for, accept, decline, or otherwise make coverage decisions for the guardian.</p>
  {message&&<p role="status">{message}</p>}

  {data&&<>
   <div className="statRow">
    <div className="stat"><span>HANDOFFS</span><strong>{data.summary.total}</strong></div>
    <div className="stat"><span>PREPARED</span><strong>{data.summary.prepared}</strong></div>
    <div className="stat"><span>STUCK</span><strong>{data.summary.stuck}</strong></div>
    <div className="stat"><span>OPEN INCIDENTS</span><strong>{data.summary.openIncidents}</strong></div>
   </div>

   <h2>Handoffs</h2>
   {data.handoffs.length===0?<p>No COVER handoffs recorded.</p>:data.handoffs.map(h=><article className="card" key={h.id}>
    <h3>{h.provider}</h3>
    <p>{h.householdId}</p>
    <p>Status: {h.status} · Age: {h.ageHours}h · Stuck: {h.stuck?'yes':'no'}</p>
    <p>Annual premium: {'$'+h.annualPremium.toFixed(0)}</p>
    {h.openIncident?<p><strong>Open incident:</strong> {h.openIncident.category} / {h.openIncident.severity} / {h.openIncident.status}</p>:<button onClick={()=>act({
     action:'incident.create',householdId:h.householdId,handoffId:h.id,
     category:h.stuck?'stuck_handoff':'manual_review',severity:h.stuck?'warning':'info',
     summary:h.stuck?'Prepared COVER handoff has been waiting more than 24 hours.':'Manual operational review requested.'
    })}>Create incident</button>}
   </article>)}

   <h2>Incident queue</h2>
   {data.incidents.length===0?<p>No COVER incidents.</p>:data.incidents.map(i=><article className="card" key={i.id}>
    <h3>{i.category.replaceAll('_',' ')}</h3>
    <p>{i.summary}</p>
    <p>{i.householdId} · {i.severity} · {i.status}</p>
    {i.status==='open'&&<button onClick={()=>act({action:'incident.acknowledge',householdId:i.householdId,incidentId:i.id,note:'Acknowledged by platform operations.'})}>Acknowledge</button>}
    {i.status!=='resolved'&&<button onClick={()=>act({action:'incident.resolve',householdId:i.householdId,incidentId:i.id,note:'Operational incident resolved; insurance decision remains with guardian/licensed channel.'})}>Resolve</button>}
   </article>)}
  </>}
 </main>;
}
