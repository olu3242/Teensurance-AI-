'use client';
import {useCallback,useEffect,useState} from 'react';

type TransactionData={
 consents:{marketplace?:{granted:boolean};telematics?:{granted:boolean};documentProcessing?:{granted:boolean}};
 handoffs:{id:string;provider:string;annualPremium:number;status:string;disclaimer:string;createdAt:string}[];
 activity:{id:string;type:string;summary:string;at:string}[];
};
async function json(r:Response){const d=await r.json();if(!r.ok)throw new Error(d.error||'SAVE transaction failed.');return d}
export function SaveTransactionCenter({householdId,quotes,onChanged}:{householdId:string;quotes:{id:string;provider:string;annualPremium:number}[];onChanged?:()=>void}){
 const [data,setData]=useState<TransactionData>();const [message,setMessage]=useState('');const [error,setError]=useState('');
 const load=useCallback(()=>fetch('/api/save/transaction?household='+encodeURIComponent(householdId),{cache:'no-store'}).then(json).then(setData).catch(e=>setError(e.message)),[householdId]);
 useEffect(()=>{load()},[load]);
 async function act(payload:unknown){
  setError('');setMessage('');
  try{await json(await fetch('/api/save/transaction',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}));setMessage('Parent decision recorded.');await load();onChanged?.()}catch(e){setError((e as Error).message)}
 }
 const consent=(type:'marketplace'|'telematics'|'document_processing',granted:boolean)=>act({action:'consent.set',householdId,type,granted});
 return <section className="dashCard savePanel wideCard">
  <span>09 / PARENT CONSENT + COVER</span><h2>Control what SAVE may do</h2>
  <p>Consent can be changed at any time. Quote requests and insurance handoffs remain parent-controlled.</p>
  {message&&<p className="saveNotice">{message}</p>}{error&&<p className="saveError" role="alert">{error}</p>}
  <div className="consentGrid">
   {(['marketplace','telematics','document_processing'] as const).map(type=>{const key=type==='document_processing'?'documentProcessing':type;const granted=Boolean(data?.consents[key]?.granted);return <article key={type}><strong>{type.replaceAll('_',' ')}</strong><span>{granted?'Granted':'Not granted'}</span><button className="secondary" onClick={()=>consent(type,!granted)}>{granted?'Revoke':'Grant'}</button></article>})}
  </div>
  <div className="saveTransactionActions">
   <button className="secondary" disabled={!data?.consents.marketplace?.granted} onClick={()=>act({action:'quotes.request',householdId})}>Request comparable quotes</button>
  </div>
  <h3>Prepare COVER handoff</h3>
  {quotes.length?quotes.map(q=><div className="quoteRow" key={q.id}><div><strong>{q.provider}</strong><span>{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(q.annualPremium)} / year</span></div><button className="secondary" onClick={()=>act({action:'cover.prepare',householdId,quoteId:q.id})}>Prepare handoff</button></div>):<p>No comparable quotes are available for handoff.</p>}
  <h3>Decision history</h3>
  <div className="saveActivity">{data?.activity.slice(0,10).map(x=><div key={x.id}><strong>{x.type.replaceAll('_',' ')}</strong><span>{x.summary}</span><small>{new Date(x.at).toLocaleString()}</small></div>)}</div>
  <small>Teensurance does not bind, cancel or modify insurance. Final insurance transactions occur with the insurer or licensed insurance channel.</small>
 </section>;
}
