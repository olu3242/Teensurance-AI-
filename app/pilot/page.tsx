'use client';
import {useEffect,useMemo,useState} from 'react';
import {safetyTopics,steps,type Confidence,type DrivingState,type Role,type State,initialState,progress as calculate,readinessPassport} from '@/lib/domain';

type ResponseData={state:State;progress?:ReturnType<typeof calculate>;passport?:ReturnType<typeof readinessPassport>;policy?:{decision:string;reason:string};error?:string;os?:{journey:{nextBestStep:{agent:string;title:string;why:string;action:string}}}};
type Tab='journey'|'prepare'|'log'|'passport'|'family';
const today=()=>new Date().toLocaleDateString('en-CA');
const statusLabel={not_started:'Not started',building:'Building',evidence_present:'Evidence present'} as const;

export default function Page(){
 const [state,setState]=useState<State>(initialState());
 const [role,setRole]=useState<Role>('teen');
 const [driving,setDriving]=useState<DrivingState>('parked');
 const [tab,setTab]=useState<Tab>('journey');
 const [selected,setSelected]=useState(2);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [form,setForm]=useState({date:today(),minutes:45,night:false,skill:'Quiet streets',supervisor:'',note:''});
 const [plan,setPlan]=useState({skill:'Quiet streets',objective:'Practice smooth scanning and calm decision-making',supervisor:''});
 const [reflection,setReflection]=useState<{logId:string;confidence:Confidence;challenge:string;nextFocus:string}>({logId:'',confidence:'building',challenge:'',nextFocus:''});
 const [goal,setGoal]=useState(20);
 const [nextAction,setNextAction]=useState<{agent:string;title:string;why:string;action:string}|null>(null);
 const p=useMemo(()=>calculate(state),[state]);
 const passport=useMemo(()=>readinessPassport(state),[state]);

 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  if(params.get('role')==='parent')setRole('parent');
  if(params.get('tab')==='family')setTab('family');
  if(params.get('mode')==='drive')setDriving('driving');
  const step=Number(params.get('step'));
  if(params.has('step')&&Number.isInteger(step)&&step>=0&&step<steps.length)setSelected(step);
 },[]);
 useEffect(()=>{
  fetch('/api/pilot',{cache:'no-store'}).then(r=>r.json()).then((d:ResponseData)=>{
    setState(d.state);setGoal(d.state.goalHours);
    if(d.state.activePlan)setPlan({skill:d.state.activePlan.skill,objective:d.state.activePlan.objective,supervisor:d.state.activePlan.supervisor});
    if(d.os?.journey?.nextBestStep)setNextAction(d.os.journey.nextBestStep);
  }).catch(()=>setMessage('Could not load the pilot. Refresh to try again.')).finally(()=>setLoading(false));
 },[]);

 async function act(payload:Record<string,unknown>){
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/pilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,role,drivingState:driving})});
   const data:ResponseData=await response.json();
   if(data.state)setState(data.state);
   if(data.os?.journey?.nextBestStep)setNextAction(data.os.journey.nextBestStep);
   if(!response.ok){setMessage(data.policy?.reason||data.error||'Could not save. Try again.');return false}
   setMessage(data.policy?.reason||'Saved.');return true;
  }catch{setMessage('Connection problem. Please try again.');return false}
  finally{setBusy(false)}
 }
 async function submit(e:React.FormEvent){
  e.preventDefault();
  const ok=await act({action:'log',...form,minutes:Number(form.minutes)});
  if(ok){setForm({...form,minutes:45,note:''});setTab('family')}
 }
 async function savePlan(e:React.FormEvent){e.preventDefault();await act({action:'plan',...plan})}
 async function saveReflection(e:React.FormEvent){
  e.preventDefault();
  const ok=await act({action:'reflect',...reflection});
  if(ok)setReflection({...reflection,challenge:'',nextFocus:''});
 }

 if(driving==='driving')return <main className="driving"><div className="driveMark">T<span>•</span></div><p>Drive mode / GUARD active</p><h1>Eyes up.<br/>Phone down.</h1><div className="driveRule">No chat. No rewards. No prompts. No manual entry.</div><button onClick={()=>setDriving('parked')}>I’m safely parked</button><small>Only tap after the vehicle is stopped and safely parked.</small></main>;

 const teenChecks=safetyTopics.filter(item=>item.owner==='teen');
 const parentChecks=safetyTopics.filter(item=>item.owner==='parent');
 const activeChecks=new Set(state.safetyChecks.map(item=>item.topic));
 const reflectable=state.logs.filter(log=>!state.reflections.some(item=>item.logId===log.id));

 return <div className="appShell">
  <aside className="sidebar">
   <div className="brand"><span className="brandMark">T<span>•</span></span><span>teensurance<small>SAFETY BEFORE SPEED</small></span></div>
   <div className="navLabel">YOUR SPACE</div>
   <nav aria-label="Main navigation">
    <button className={tab==='journey'?'active':''} onClick={()=>setTab('journey')}><span>◫</span> Journey</button>
    <button className={tab==='prepare'?'active':''} onClick={()=>setTab('prepare')}><span>✓</span> Prepare safely</button>
    <button className={tab==='log'?'active':''} onClick={()=>setTab('log')}><span>↗</span> Log a drive</button>
    <button className={tab==='passport'?'active':''} onClick={()=>setTab('passport')}><span>▦</span> Passport</button>
    <button className={tab==='family'?'active':''} onClick={()=>setTab('family')}><span>◎</span> Family review {p.pending>0&&<b>{p.pending}</b>}</button>
   </nav>
   <div className="sideBottom"><div className="safetyDot">● &nbsp; GUARD ACTIVE</div><p>Prepare and reflect while parked. During a drive, Teensurance gets out of the way.</p><button onClick={()=>setDriving('driving')} className="drivingButton">I’m driving now →</button></div>
  </aside>
  <main className="main">
   <header className="topbar"><span>FAMILY PILOT <span className="slash">/</span> {tab.replace('_',' ')}</span><div className="roleSwitch" aria-label="Pilot role"><button className={role==='teen'?'chosen':''} onClick={()=>setRole('teen')}>Teen view</button><button className={role==='parent'?'chosen':''} onClick={()=>setRole('parent')}>Parent view</button></div></header>
   {loading?<div className="loading">Loading your journey…</div>:<>
    {!state.consent[role==='teen'?'teenAcknowledged':'guardianAcknowledged']&&<section className="nextSafe"><span>VIBE / PILOT SETUP</span><strong>Review the pilot data purpose</strong><p>This local MVP records practice, safety checks and family review evidence. It is not production consent or identity verification.</p><button className="primary" disabled={busy} onClick={()=>act({action:role==='teen'?'consent_teen':'consent_guardian'})}>Acknowledge for this pilot <span>→</span></button></section>}
    {role==='parent'&&state.consent.guardianAcknowledged&&state.guardian.relationshipStatus!=='verified'&&<section className="nextSafe"><span>VIBE / GUARDIAN SETUP</span><strong>Confirm your pilot role</strong><p>This is a local-pilot attestation only. Production requires authenticated guardian identity and relationship verification.</p><button className="primary" disabled={busy} onClick={()=>act({action:'guardian'})}>Confirm pilot guardian role <span>→</span></button></section>}
    {message&&<div role="status" className="message">{message}<button aria-label="Dismiss notice" onClick={()=>setMessage('')}>×</button></div>}
    {tab==='journey'&&<>
     {nextAction&&<section className="nextSafe"><span>{nextAction.agent} / NEXT BEST STEP</span><strong>{nextAction.title}</strong><p>{nextAction.why}</p><button className="primary" onClick={()=>setTab(nextAction.action as Tab)}>Continue safely <span>→</span></button></section>}
     <section className="intro"><div><div className="eyebrow">YOUR ROADMAP <span>WORKFLOW OS · SAFETY-BY-DESIGN</span></div><h1>Earn independence.<br/><em>Build readiness.</em></h1><p>Progress means preparation, verified practice and reflection — never driving more just to keep a streak alive.</p></div><div className="introAside"><span>READINESS EVIDENCE</span><strong>{passport.evidencePresent}<small> / {passport.evidenceTotal}</small></strong><div className="bar"><i style={{width:`${passport.evidencePresent/passport.evidenceTotal*100}%`}}/></div><small>Evidence summary only · Not a licensing or insurance score</small></div></section>
     <div className="contentGrid"><section><div className="sectionHead"><h2>The journey</h2><span>Choose a step to see the direction</span></div><div className="steps">{steps.map((s,i)=><button key={s.id} className={`step ${selected===i?'selected':''}`} onClick={()=>setSelected(i)}><span className="stepNum">0{i+1}</span><span className="stepTitle">{s.name}<small>{s.agent} · {i<2?'Get ready':i===2?'Build experience':'Plan ahead'}</small></span><span className="arrow">↗</span></button>)}</div></section><section className="detail" aria-live="polite"><div className="detailTop"><span>STEP 0{selected+1}</span><span className="agent">{steps[selected].agent}</span></div><h2>{steps[selected].name}</h2><p>{steps[selected].detail}</p><div className="detailDivider"/><h3>What counts as complete</h3><p>{steps[selected].proof}</p><div className="sourceNotice">Requirements vary by location. Confirm permit, hour, test and insurance rules with official sources before making decisions.</div>{selected===2&&<button className="primary" onClick={()=>setTab('prepare')}>Prepare the next drive <span>→</span></button>}</section></div>
    </>}
    {tab==='prepare'&&<div className="workspace"><div className="pageTitle"><div className="eyebrow">CRUZE / BEFORE THE DRIVE</div><h1>Prepare. Then put the phone away.</h1><p>Choose one practice objective while parked. Safety checks are evidence of preparation, not points or rewards.</p></div><div className="formGrid">
      <form onSubmit={savePlan} className="card formCard"><div className="formHeader"><h2>Next practice plan</h2><span>PARKED ONLY</span></div><div className="fields"><label>Focus area<select value={plan.skill} onChange={e=>setPlan({...plan,skill:e.target.value})}><option>Quiet streets</option><option>Turns & intersections</option><option>Parking</option><option>Highway merging</option><option>Night driving</option></select></label><label>Supervisor<input required minLength={2} maxLength={80} value={plan.supervisor} onChange={e=>setPlan({...plan,supervisor:e.target.value})}/></label><label className="full">One objective<textarea required minLength={3} maxLength={180} value={plan.objective} onChange={e=>setPlan({...plan,objective:e.target.value})}/></label></div><button type="submit" className="primary" disabled={busy||role!=='teen'}>Save parked plan <span>→</span></button>{role==='parent'&&<p className="inlineHelp">The teen owns the practice plan. Parents confirm guardian safety items separately.</p>}</form>
      <section className="card"><div className="formHeader"><h2>Safety setup</h2><span>NO SCORE</span></div><div className="checkList">{(role==='teen'?teenChecks:parentChecks).map(item=><div className="checkItem" key={item.id}><div><strong>{item.label}</strong><p>{item.description}</p></div><button disabled={busy||activeChecks.has(item.id)} onClick={()=>act({action:'safety',topic:item.id})}>{activeChecks.has(item.id)?'Recorded':'Confirm'}</button></div>)}</div></section>
     </div></div>}
    {tab==='log'&&<div className="workspace"><div className="pageTitle"><div className="eyebrow">MILES / AFTER THE DRIVE</div><h1>Log it while parked.</h1><p>A parent reviews each entry before it counts toward family progress. Logged time alone never establishes licensing eligibility.</p></div><div className="formGrid"><form onSubmit={submit} className="card formCard"><div className="formHeader"><h2>New supervised session</h2><span>POST-DRIVE</span></div><div className="fields"><label>Date<input type="date" required max={today()} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Minutes practiced<input type="number" required min="1" max="240" value={form.minutes} onChange={e=>setForm({...form,minutes:Number(e.target.value)})}/></label><label>Focus area<input required maxLength={60} value={form.skill} onChange={e=>setForm({...form,skill:e.target.value})}/></label><label>Supervisor name<input required minLength={2} maxLength={80} value={form.supervisor} onChange={e=>setForm({...form,supervisor:e.target.value})}/></label><label className="full checkbox"><input type="checkbox" checked={form.night} onChange={e=>setForm({...form,night:e.target.checked})}/> This session included night driving</label><label className="full">Notes <span className="optional">OPTIONAL</span><textarea maxLength={300} value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label></div><button type="submit" className="primary" disabled={busy||role!=='teen'}>Save for parent review <span>→</span></button></form><div className="tips"><span className="tag">MILES / SAFETY RULE</span><h2>No app engagement while moving.</h2><p>Teensurance does not award driving streaks, miles, speed, trip counts or competitive rank. Plan before. Drive. Reflect after.</p><div className="rule"><strong>01</strong><span>Prepare while parked</span></div><div className="rule"><strong>02</strong><span>Drive with the phone away</span></div><div className="rule"><strong>03</strong><span>Log and reflect after parking</span></div></div></div></div>}
    {tab==='passport'&&<div className="workspace"><div className="pageTitle"><div className="eyebrow">SAFETY & READINESS PASSPORT</div><h1>Evidence, not a judgment.</h1><p>{passport.disclaimer}</p></div><div className="passportGrid">{passport.dimensions.map(item=><article className="passportCard" key={item.id}><span className={`passportStatus ${item.status}`}>{statusLabel[item.status]}</span><h2>{item.label}</h2><p>{item.detail}</p></article>)}</div><div className="nextSafe"><span>NEXT SAFE STEP</span><strong>{passport.nextSafeStep}</strong><p>Continue at your pace. Teensurance never asks you to drive more for engagement, rewards or ranking.</p></div></div>}
    {tab==='family'&&<div className="workspace"><div className="pageTitle"><div className="eyebrow">FAMILY / SHARED PROGRESS</div><h1>Verify. Reflect. Improve.</h1><p>Verified entries count toward your optional family goal. This tracker does not determine licensing eligibility.</p></div><div className="statRow"><div className="stat"><span>VERIFIED PRACTICE</span><strong>{(p.verifiedMinutes/60).toFixed(1)} <small>hr</small></strong></div><div className="stat"><span>SAFETY CHECKS</span><strong>{state.safetyChecks.length.toString().padStart(2,'0')}</strong></div><div className="stat"><span>AWAITING REVIEW</span><strong>{p.pending.toString().padStart(2,'0')}</strong></div></div><div className="familyGrid"><section className="card"><div className="formHeader"><h2>Practice history</h2><span>{state.logs.length} ENTRIES</span></div>{state.logs.length===0?<div className="empty">No drives recorded yet.</div>:<div className="history">{state.logs.map(l=><div className="historyItem" key={l.id}><div><strong>{l.skill}</strong><span>{l.date} · {l.minutes} min · {l.supervisor}{l.night?' · Night':''}</span>{l.note&&<p>{l.note}</p>}</div><div className="historyAction"><span className={l.status==='verified'?'verified':'pending'}>{l.status==='verified'?'Verified':'Pending'}</span>{l.status==='pending'&&role==='parent'&&<button disabled={busy} onClick={()=>act({action:'verify',id:l.id})}>Verify entry →</button>}</div></div>)}</div>}</section><section className="card goalCard"><div className="formHeader"><h2>Family goal</h2><span>OPTIONAL</span></div><p>Set a family practice target. It is never presented as the legal requirement.</p><label>Goal in hours<input type="number" min="1" max="200" value={goal} onChange={e=>setGoal(Number(e.target.value))}/></label><button disabled={busy||role!=='parent'} className="secondary" onClick={()=>act({action:'goal',hours:Number(goal)})}>Update goal</button><div className="goalBar"><div className="bar"><i style={{width:`${p.percent}%`}}/></div><span>{p.percent}% of family goal</span></div></section></div>
      {role==='teen'&&reflectable.length>0&&<form className="card reflectionCard" onSubmit={saveReflection}><div className="formHeader"><h2>Post-drive reflection</h2><span>CRUZE</span></div><div className="fields"><label>Drive<select required value={reflection.logId} onChange={e=>setReflection({...reflection,logId:e.target.value})}><option value="">Choose a drive</option>{reflectable.map(log=><option key={log.id} value={log.id}>{log.date} · {log.skill}</option>)}</select></label><label>How did it feel?<select value={reflection.confidence} onChange={e=>setReflection({...reflection,confidence:e.target.value as Confidence})}><option value="building">Still building</option><option value="steady">Steadier</option><option value="confident">Confident with this skill</option></select></label><label>Challenge<textarea maxLength={180} value={reflection.challenge} onChange={e=>setReflection({...reflection,challenge:e.target.value})}/></label><label>Next focus<textarea required minLength={2} maxLength={120} value={reflection.nextFocus} onChange={e=>setReflection({...reflection,nextFocus:e.target.value})}/></label></div><button className="primary" disabled={busy}>Save reflection <span>→</span></button></form>}
     </div>}
   </>}
  </main>
 </div>;
}
