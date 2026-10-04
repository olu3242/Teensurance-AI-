'use client';
import {useEffect,useState} from 'react';

type Policy={policyId:string;carrierId:string;externalPolicyId:string;teenName:string;status:string;effectiveAt?:string;renewalAt?:string;cancellationAt?:string;coveredVehicles:Array<{year:number;make:string;model:string;vinLast4?:string}>;documents:Array<{label:string;available:boolean;externalUrl?:string}>;timeline:Array<{state:string;at:string;source:string}>;attention?:string};
type Dashboard={activeCount:number;attentionCount:number;disclaimer:string;policies:Policy[]};

export default function ParentInsurancePage(){
 const [data,setData]=useState<Dashboard|null>(null);const [error,setError]=useState('');const [missing,setMissing]=useState(false);
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get('householdId')||'';if(!id){setMissing(true);return}fetch('/api/insurance/dashboard?householdId='+encodeURIComponent(id),{cache:'no-store'}).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.error||'Unable to load insurance.');return b as Dashboard}).then(setData).catch(e=>setError(e instanceof Error?e.message:'Unable to load insurance.'))},[]);
 if(missing)return <main className="shell"><h1>Insurance</h1><p>Select a household from your parent dashboard to view coverage.</p></main>;
 if(error)return <main className="shell"><h1>Insurance</h1><p role="alert">{error}</p></main>;
 if(!data)return <main className="shell"><h1>Insurance</h1><p>Loading carrier-confirmed policy status...</p></main>;
 return <main className="shell"><header><p className="eyebrow">Parent insurance center</p><h1>Coverage and policy lifecycle</h1><p>{data.activeCount} active · {data.attentionCount} needing attention</p></header>
 {data.policies.length===0?<section className="card"><h2>No carrier-confirmed policy yet</h2><p>Complete quote comparison and carrier binding first.</p></section>:null}
 {data.policies.map(p=><article className="card" key={p.policyId}><div className="split"><div><h2>{p.teenName}</h2><p>Carrier: {p.carrierId}</p><p>Policy: {p.externalPolicyId}</p></div><strong>{p.status.replaceAll('_',' ')}</strong></div>
 {p.attention?<p role="alert"><strong>{p.attention}</strong></p>:null}
 <div className="grid"><p><b>Effective</b><br/>{p.effectiveAt||'Carrier not provided'}</p><p><b>Renewal</b><br/>{p.renewalAt||'Carrier not provided'}</p><p><b>Cancellation</b><br/>{p.cancellationAt||'None reported'}</p></div>
 <h3>Covered vehicles</h3>{p.coveredVehicles.length?p.coveredVehicles.map((v,i)=><p key={i}>{v.year} {v.make} {v.model}{v.vinLast4?' · VIN ••••'+v.vinLast4:''}</p>):<p>Vehicle details unavailable.</p>}
 <h3>Carrier documents</h3><ul>{p.documents.map((d,i)=><li key={i}>{d.available&&d.externalUrl?<a href={d.externalUrl} target="_blank" rel="noreferrer">{d.label}</a>:d.label+' — not yet available'}</li>)}</ul>
 <details><summary>Policy timeline</summary><ol>{p.timeline.map((t,i)=><li key={i}>{t.at} · {t.state} · {t.source}</li>)}</ol></details></article>)}
 <p className="fine">{data.disclaimer}</p>
 <style jsx>{`.shell{max-width:960px;margin:40px auto;padding:0 20px}.eyebrow{text-transform:uppercase;letter-spacing:1px;font-size:12px}.card{border:1px solid #d9d9d9;border-radius:16px;padding:22px;margin:18px 0}.split{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.fine{font-size:13px}`}</style></main>
}