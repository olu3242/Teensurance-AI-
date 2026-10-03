'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ScoutLearningCard} from '@/components/ScoutLearningCard';
import {StateLegalContextCard} from '@/components/StateLegalContextCard';
import {BrandLoader} from '@/components/BrandLoader';import {BrandLogo} from '@/components/BrandLogo';import {DashboardCustomizer} from '@/components/DashboardCustomizer';import {HelpChat} from '@/components/HelpChat';import {TimeCalculator} from '@/components/TimeCalculator';
import {defaultDashboardPreferences} from '@/lib/dashboard-config';import {initialState,progress,readinessPassport,type State} from '@/lib/domain';
const options=[{id:'review_queue',label:'Review queue'},{id:'time',label:'Practice time calculator'},{id:'family_progress',label:'Family progress'},{id:'safety',label:'Safety evidence'},{id:'coverage',label:'Coverage preparation'}];
export default function ParentDashboard(){
 const [loadError,setLoadError]=useState('');
 const [state,setState]=useState<State>(initialState());const [loading,setLoading]=useState(true);const [widgets,setWidgets]=useState<string[]>(defaultDashboardPreferences.parent);const update=useCallback((x:string[])=>setWidgets(x),[]);const p=useMemo(()=>progress(state),[state]);const passport=useMemo(()=>readinessPassport(state),[state]);
 useEffect(()=>{fetch('/api/pilot',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load progress.');setState(d.state)}).catch(e=>setLoadError(e.message)).finally(()=>setLoading(false))},[]);
 if(loadError)return <main className="dashboardPage"><h1>Your learning workspace</h1><p role="alert">{loadError}</p><Link href="/pilot">Sign in or complete family setup</Link></main>;
 if(loading)return <BrandLoader label="Loading parent dashboard"/>;
 return <main className="dashboardPage"><header className="dashboardHeader"><BrandLogo/><nav><Link href="/pilot?role=parent&tab=family">Family review</Link><Link href="/dashboard/teen">Teen dashboard</Link></nav></header><section className="dashboardHero"><div><span>PARENT DASHBOARD / FAMILY COMMAND</span><h1>Guide progress.<br/>Keep context clear.</h1><p>Review practice, see learning progress and adjust family planning without turning readiness into a score.</p></div><DashboardCustomizer storageKey="teensurance.parent.widgets" options={options} onChange={update}/></section><div className="dashboardGrid"><StateLegalContextCard/>
 {widgets.includes('review_queue')&&<section className="dashCard accentCard"><span>MILES / REVIEW QUEUE</span><h2>{p.pending} pending {p.pending===1?'drive':'drives'}</h2><p>Only verified practice contributes to family progress.</p><Link href="/pilot?role=parent&tab=family">Review entries →</Link></section>}
 {widgets.includes('time')&&<TimeCalculator verifiedMinutes={p.verifiedMinutes} nightMinutes={p.nightMinutes} goalHours={state.goalHours}/>}
 {widgets.includes('family_progress')&&<section className="dashCard"><span>FAMILY PROGRESS</span><h2>{(p.verifiedMinutes/60).toFixed(1)} verified hours</h2><p>{passport.evidencePresent} of {passport.evidenceTotal} Passport evidence areas currently have evidence.</p></section>}
 {widgets.includes('safety')&&<section className="dashCard"><span>SAFETY EVIDENCE</span><h2>{state.safetyChecks.length} checks recorded</h2><p>{state.lessonAttempts.filter(x=>x.completedAt).length} learning lessons completed.</p><Link href="/learn">Review lesson program →</Link></section>}
 {widgets.includes('coverage')&&<section className="dashCard"><span>COVER / PREP</span><h2>Insurance conversation preparation</h2><p>Household and vehicle preparation only. No quote, underwriting or eligibility decision.</p><Link href="/pilot?role=parent">Open COVER journey →</Link></section>}
 <ScoutLearningCard passport/></div><HelpChat context="parent-dashboard"/></main>
}
