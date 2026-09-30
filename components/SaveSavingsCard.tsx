'use client';
import {useEffect,useState} from 'react';

type SaveView={
 baseline?:{annualPremium?:number;renewalDate?:string};
 opportunities:{id:string;category:string;status:string;reason:string;nextAction:string}[];
 latestDecision?:{action:string;reason:string};
 verifiedAnnualSavings:number;
 savingsReadiness:{baseline:boolean;coverageComparable:boolean;opportunities:number;verifiedOutcomes:number};
};

export function SaveSavingsCard({householdId}:{householdId?:string}){
 const [data,setData]=useState<SaveView>();const [error,setError]=useState('');
 useEffect(()=>{if(!householdId)return;fetch(`/api/save?household=${encodeURIComponent(householdId)}`,{cache:'no-store'})
   .then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load SAVE.');setData(d)})
   .catch(e=>setError(e.message))},[householdId]);
 if(!householdId)return <section className="dashCard"><span>SAVE / COST STRATEGY</span><h2>Complete family setup</h2><p>SAVE needs a household before it can track insurance cost opportunities.</p></section>;
 if(error)return <section className="dashCard"><span>SAVE / COST STRATEGY</span><h2>Savings data unavailable</h2><p>{error}</p></section>;
 if(!data)return <section className="dashCard"><span>SAVE / COST STRATEGY</span><h2>Checking savings opportunities…</h2><p>SAVE only reports evidence-backed opportunities.</p></section>;
 const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
 return <section className="dashCard accentCard">
   <span>SAVE / INSURANCE COST STRATEGIST</span>
   <h2>{data.verifiedAnnualSavings>0?`${money.format(data.verifiedAnnualSavings)} verified annual savings`:'Build your savings baseline'}</h2>
   <p>{data.baseline?.annualPremium!==undefined?`Current recorded annual premium: ${money.format(data.baseline.annualPremium)}.`:'Capture the current policy before Teensurance measures savings.'}</p>
   <div className="miniStats">
     <strong>{data.savingsReadiness.opportunities}</strong> active opportunities · <strong>{data.savingsReadiness.verifiedOutcomes}</strong> verified outcomes
   </div>
   {data.latestDecision&&<p><strong>Next best savings action:</strong> {data.latestDecision.reason}</p>}
   {data.opportunities[0]&&<p className="muted">{data.opportunities[0].nextAction}</p>}
   <small>Potential and quoted savings are not counted as verified savings. Comparable coverage and carrier/quote evidence are required.</small>
 </section>;
}
