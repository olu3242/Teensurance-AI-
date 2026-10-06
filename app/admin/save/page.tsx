'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {BrandLogo} from '@/components/BrandLogo';

type Summary={
 mode:'summary';
 households:Array<{
  householdId:string;baseline:boolean;renewalDate?:string;opportunityCount:number;quoteCount:number;
  consentCount:number;coverHandoffCount:number;verifiedSavingsCount:number;verifiedAnnualSavings:number;
  noticeCount:number;policyReviewPending:boolean;
 }>;
 totals:{households:number;opportunities:number;quotes:number;verifiedSavingsEntries:number;verifiedAnnualSavings:number;coverHandoffs:number;pendingPolicyReviews:number};
 boundary:string;
};

type Household={
 mode:'household';householdId:string;baseline?:Record<string,unknown>;opportunities:Record<string,unknown>[];
 decisions:Record<string,unknown>[];quotes:Record<string,unknown>[];verifiedSavings:Record<string,unknown>[];
 consents:Record<string,unknown>[];coverHandoffs:Record<string,unknown>[];activity:Record<string,unknown>[];
 notices:Record<string,unknown>[];vehicles:Record<string,unknown>[];policyExtractions:Record<string,unknown>[];
 verifiedAnnualSavings:number;boundary:string;
};

export default function SaveAdminPage(){
 const [data,setData]=useState<Summary|Household>();
 const [message,setMessage]=useState('');

 async function refresh(householdId?:string){
  const response=await fetch('/api/admin/save'+(householdId?'?household='+encodeURIComponent(householdId):''),{cache:'no-store'});
  const body=await response.json();
  if(!response.ok)throw new Error(body.error||'Unable to load SAVE operations.');
  setData(body);
 }

 useEffect(()=>{refresh().catch(e=>setMessage(e.message))},[]);

 return <main className="dashboardPage">
  <header className="dashboardHeader"><BrandLogo/></header>
  <p><Link href="/admin">← Platform operations</Link></p>
  <h1>SAVE operations</h1>
  <p>Platform-admin inspection only. Guardian approval remains required for insurance consent, quote submission, telematics enrollment, carrier selection, binding, cancellation, payment, and legal attestations.</p>
  {message&&<p role="status">{message}</p>}

  {data?.mode==='summary'&&<>
   <div className="statRow">
    <div className="stat"><span>HOUSEHOLDS</span><strong>{data.totals.households}</strong></div>
    <div className="stat"><span>OPPORTUNITIES</span><strong>{data.totals.opportunities}</strong></div>
    <div className="stat"><span>QUOTES</span><strong>{data.totals.quotes}</strong></div>
    <div className="stat"><span>VERIFIED SAVINGS</span><strong>{'$'+data.totals.verifiedAnnualSavings.toFixed(0)}</strong></div>
   </div>
   <h2>Households</h2>
   {data.households.length===0?<p>No SAVE activity recorded yet.</p>:data.households.map(h=><article className="card" key={h.householdId}>
    <h3>{h.householdId}</h3>
    <p>Baseline: {h.baseline?'yes':'no'} · Opportunities: {h.opportunityCount} · Quotes: {h.quoteCount} · Active consents: {h.consentCount}</p>
    <p>Verified savings entries: {h.verifiedSavingsCount} · Verified annual savings: {'$'+h.verifiedAnnualSavings.toFixed(0)}</p>
    <p>COVER handoffs: {h.coverHandoffCount} · Notices: {h.noticeCount} · Policy review pending: {h.policyReviewPending?'yes':'no'}</p>
    {h.renewalDate&&<p>Renewal: {h.renewalDate}</p>}
    <button onClick={()=>refresh(h.householdId).catch(e=>setMessage(e.message))}>Inspect SAVE household</button>
   </article>)}
  </>}

  {data?.mode==='household'&&<>
   <p><button onClick={()=>refresh().catch(e=>setMessage(e.message))}>← All SAVE households</button></p>
   <h2>Household inspection</h2>
   <p><strong>{data.householdId}</strong></p>
   <p>Verified annual savings: <strong>{'$'+data.verifiedAnnualSavings.toFixed(0)}</strong></p>
   <section className="card"><h3>Policy baseline</h3><pre>{JSON.stringify(data.baseline||null,null,2)}</pre></section>
   <section className="card"><h3>Savings opportunities</h3><pre>{JSON.stringify(data.opportunities,null,2)}</pre></section>
   <section className="card"><h3>Quotes</h3><pre>{JSON.stringify(data.quotes,null,2)}</pre></section>
   <section className="card"><h3>Consent provenance</h3><pre>{JSON.stringify(data.consents,null,2)}</pre></section>
   <section className="card"><h3>COVER handoffs</h3><pre>{JSON.stringify(data.coverHandoffs,null,2)}</pre></section>
   <section className="card"><h3>Verified savings ledger</h3><pre>{JSON.stringify(data.verifiedSavings,null,2)}</pre></section>
   <section className="card"><h3>Renewal & opportunity notices</h3><pre>{JSON.stringify(data.notices,null,2)}</pre></section>
   <section className="card"><h3>SAVE activity</h3><pre>{JSON.stringify(data.activity,null,2)}</pre></section>
   <section className="card"><h3>Vehicles</h3><pre>{JSON.stringify(data.vehicles,null,2)}</pre></section>
   <section className="card"><h3>Policy document review status</h3><pre>{JSON.stringify(data.policyExtractions,null,2)}</pre></section>
  </>}
 </main>;
}
