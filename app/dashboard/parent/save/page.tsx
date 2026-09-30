'use client';
import {FormEvent,useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {BrandLoader} from '@/components/BrandLoader';
import {BrandLogo} from '@/components/BrandLogo';

type SaveData={
 baseline?:{carrierName?:string;annualPremium?:number;renewalDate?:string;coverageFingerprint?:string;deductible?:number;drivers:number;vehicles:number};
 opportunities:{id:string;category:string;status:string;reason:string;nextAction:string}[];
 quotes:{id:string;provider:string;annualPremium:number;coverageFingerprint:string;capturedAt:string}[];
 verifiedSavings:{id:string;previousAnnualPremium:number;newAnnualPremium:number;annualSavings:number;verifiedAt:string}[];
 verifiedAnnualSavings:number;
 savingsReadiness:{baseline:boolean;coverageComparable:boolean;opportunities:number;verifiedOutcomes:number};
};
type Passport={items:{id:string;label:string;status:'missing'|'present'|'verified';source:string}[];complete:number;total:number;percent:number;disclaimer:string};
type Scenario={comparable:boolean;projectedAnnualPremium?:number;projectedDifference?:number;direction:string;verified:false;warnings:string[]};

async function readJson(response:Response){const data=await response.json();if(!response.ok)throw new Error(data.error||'Request failed.');return data}
async function post(url:string,payload:unknown){return readJson(await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}))}

export default function ParentSaveWorkspace(){
 const [householdId,setHouseholdId]=useState<string>();
 const [data,setData]=useState<SaveData>();
 const [passport,setPassport]=useState<Passport>();
 const [scenario,setScenario]=useState<Scenario>();
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [policyText,setPolicyText]=useState('');
 const [vin,setVin]=useState('');
 const [scenarioPremium,setScenarioPremium]=useState('');
 const [scenarioDeductible,setScenarioDeductible]=useState('');
 const money=useMemo(()=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}),[]);

 const refresh=useCallback(async(id:string)=>{
  const [save,pass]=await Promise.all([
   readJson(await fetch('/api/save?household='+encodeURIComponent(id),{cache:'no-store'})),
   readJson(await fetch('/api/save/integrations?household='+encodeURIComponent(id),{cache:'no-store'}))
  ]);
  setData(save);setPassport(pass);
 },[]);

 useEffect(()=>{fetch('/api/workspace',{cache:'no-store'}).then(readJson).then(async d=>{
  if(d.membership?.role!=='guardian')throw new Error('Parent SAVE workspace requires a guardian role.');
  if(!d.household?.id)throw new Error('Complete family setup before using SAVE.');
  setHouseholdId(d.household.id);await refresh(d.household.id);
 }).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[refresh]);

 async function extractPolicy(e:FormEvent){
  e.preventDefault();if(!householdId)return;setError('');setMessage('');
  try{const result=await post('/api/save/integrations',{action:'policy.extract',householdId,text:policyText,mimeType:'text/plain'});setMessage('Policy facts extracted for parent review. Nothing is authoritative until reviewed and saved.');if(result.extraction?.annualPremium?.value)setScenarioPremium(String(result.extraction.annualPremium.value));}catch(e){setError((e as Error).message)}
 }
 async function decodeVin(e:FormEvent){
  e.preventDefault();if(!householdId)return;setError('');setMessage('');
  try{const result=await post('/api/save/integrations',{action:'vehicle.decode',householdId,vin});setMessage(`Vehicle added: ${result.modelYear||''} ${result.make||''} ${result.model||''}`.trim());setVin('');await refresh(householdId)}catch(e){setError((e as Error).message)}
 }
 async function runScenario(e:FormEvent){
  e.preventDefault();if(!householdId)return;setError('');
  try{const result=await post('/api/save/scenario',{householdId,proposedAnnualPremium:scenarioPremium?Number(scenarioPremium):undefined,proposedDeductible:scenarioDeductible?Number(scenarioDeductible):undefined,coverageFingerprint:data?.baseline?.coverageFingerprint,source:'estimate'});setScenario(result)}catch(e){setError((e as Error).message)}
 }
 async function verifyQuote(id:string){
  if(!householdId)return;setError('');
  try{await post('/api/save',{action:'savings.verify',householdId,quoteId:id});setMessage('Comparable quote recorded in the verified savings ledger.');await refresh(householdId)}catch(e){setError((e as Error).message)}
 }

 if(loading)return <BrandLoader label="Loading SAVE workspace"/>;
 if(error&&!householdId)return <main className="dashboardPage"><h1>SAVE workspace</h1><p role="alert">{error}</p><Link href="/dashboard/parent">Back to parent dashboard</Link></main>;

 return <main className="dashboardPage saveWorkspace">
  <header className="dashboardHeader"><BrandLogo/><nav><Link href="/dashboard/parent">Parent dashboard</Link><span className="muted">Guardian-only SAVE workspace</span></nav></header>
  <section className="dashboardHero saveHero"><div><span>SAVE / FAMILY COST CONTROL</span><h1>Understand the cost.<br/>Work the levers.</h1><p>Organize policy evidence, explore scenarios, compare like-for-like quotes and track only verified savings.</p></div><div className="saveHeroMetric"><small>VERIFIED ANNUAL SAVINGS</small><strong>{money.format(data?.verifiedAnnualSavings||0)}</strong><span>{data?.savingsReadiness.verifiedOutcomes||0} verified outcomes</span></div></section>
  {message&&<p className="saveNotice">{message}</p>}{error&&<p className="saveError" role="alert">{error}</p>}

  <div className="saveWorkspaceGrid">
   <section className="dashCard savePanel"><span>01 / POLICY BASELINE</span><h2>{data?.baseline?.carrierName||'Capture your current policy'}</h2><p>{data?.baseline?.annualPremium!==undefined?`Recorded annual premium: ${money.format(data.baseline.annualPremium)}`:'SAVE needs a reviewed policy baseline before it can verify savings.'}</p>
    <form onSubmit={extractPolicy}><label>Paste declarations or renewal text<textarea value={policyText} onChange={e=>setPolicyText(e.target.value)} placeholder="Paste policy text here for extraction and parent review."/></label><button className="secondary" disabled={policyText.trim().length<20}>Extract policy facts</button></form>
    <small>Extraction is review-first. Coverage limits and policy details must be confirmed before use.</small>
   </section>

   <section className="dashCard savePanel"><span>02 / SAVINGS PASSPORT</span><h2>{passport?.complete||0} of {passport?.total||0} evidence areas ready</h2><div className="saveProgress"><i style={{width:(passport?.percent||0)+'%'}}/></div>
    <div className="saveEvidenceList">{passport?.items.map(item=><div key={item.id}><strong>{item.label}</strong><span>{item.status} · {item.source}</span></div>)}</div><small>{passport?.disclaimer}</small>
   </section>

   <section className="dashCard savePanel"><span>03 / VEHICLES</span><h2>Add a vehicle by VIN</h2><p>RYDES uses the vehicle profile as an input to later carrier-backed scenarios.</p>
    <form onSubmit={decodeVin}><label>VIN<input value={vin} onChange={e=>setVin(e.target.value.toUpperCase())} maxLength={17} placeholder="17-character VIN"/></label><button className="secondary" disabled={vin.length<8}>Decode vehicle</button></form>
   </section>

   <section className="dashCard savePanel"><span>04 / SCENARIO LAB</span><h2>What if the premium changed?</h2><form onSubmit={runScenario}><div className="saveFormRow"><label>Scenario annual premium<input type="number" min="0" value={scenarioPremium} onChange={e=>setScenarioPremium(e.target.value)}/></label><label>Scenario deductible<input type="number" min="0" value={scenarioDeductible} onChange={e=>setScenarioDeductible(e.target.value)}/></label></div><button className="secondary">Run scenario</button></form>
    {scenario&&<div className="scenarioResult"><strong>{scenario.projectedDifference!==undefined?(scenario.projectedDifference>=0?money.format(scenario.projectedDifference)+' potential difference':money.format(Math.abs(scenario.projectedDifference))+' higher'):'No premium comparison available'}</strong><span>{scenario.comparable?'Coverage fingerprint matches current baseline.':'Coverage comparability is not confirmed.'}</span>{scenario.warnings.map(x=><small key={x}>{x}</small>)}</div>}
   </section>

   <section className="dashCard savePanel wideCard"><span>05 / OPPORTUNITIES</span><h2>Next savings actions</h2><div className="saveTable">{data?.opportunities.length?data.opportunities.map(o=><div className="saveTableRow" key={o.id}><div><strong>{o.category.replaceAll('_',' ')}</strong><span>{o.reason}</span></div><div><b>{o.status.replaceAll('_',' ')}</b><small>{o.nextAction}</small></div></div>):<p>No evidence-backed savings opportunities are active yet.</p>}</div>
   </section>

   <section className="dashCard savePanel"><span>06 / QUOTE COMPARISON</span><h2>Comparable quotes</h2>{data?.quotes.length?data.quotes.map(q=><div className="quoteRow" key={q.id}><div><strong>{q.provider}</strong><span>{money.format(q.annualPremium)} / year</span></div><button className="secondary" onClick={()=>verifyQuote(q.id)}>Verify savings</button></div>):<p>No carrier or quote results have been recorded yet.</p>}<small>Only equivalent coverage can enter the verified savings ledger.</small></section>

   <section className="dashCard savePanel"><span>07 / RENEWAL</span><h2>{data?.baseline?.renewalDate||'Renewal date not recorded'}</h2><p>{data?.baseline?.renewalDate?'SAVE will treat the 60-day window as a re-shopping checkpoint.':'Add the renewal date to your policy baseline to activate renewal monitoring.'}</p></section>

   <section className="dashCard savePanel wideCard"><span>08 / VERIFIED SAVINGS LEDGER</span><h2>Measured family savings</h2>{data?.verifiedSavings.length?data.verifiedSavings.map(x=><div className="saveTableRow" key={x.id}><div><strong>{money.format(x.annualSavings)} annual savings</strong><span>{money.format(x.previousAnnualPremium)} → {money.format(x.newAnnualPremium)}</span></div><div><b>verified</b><small>{new Date(x.verifiedAt).toLocaleDateString()}</small></div></div>):<p>No verified savings yet. Estimates and opportunities are intentionally excluded.</p>}</section>
  </div>
 </main>;
}
