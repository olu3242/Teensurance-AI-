'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {BrandLoader} from '@/components/BrandLoader';
import {BrandLogo} from '@/components/BrandLogo';
import {DashboardCustomizer} from '@/components/DashboardCustomizer';
import {HelpChat} from '@/components/HelpChat';
import {TimeCalculator} from '@/components/TimeCalculator';
import {defaultDashboardPreferences} from '@/lib/dashboard-config';
import {initialState,progress,readinessPassport,type State} from '@/lib/domain';
import {drivingLessons,lessonProgress} from '@/lib/driving-lessons';

const options=[{id:'next_step',label:'Next safe step'},{id:'time',label:'Practice time calculator'},{id:'passport',label:'Readiness Passport'},{id:'recent_drives',label:'Recent drives'},{id:'safety',label:'Driving lessons'}];

export default function TeenDashboard(){
 const [state,setState]=useState<State>(initialState());const [loading,setLoading]=useState(true);const [widgets,setWidgets]=useState<string[]>(defaultDashboardPreferences.teen);
 const update=useCallback((ids:string[])=>setWidgets(ids),[]);const p=useMemo(()=>progress(state),[state]);const passport=useMemo(()=>readinessPassport(state),[state]);const lessons=lessonProgress(state.lessonAttempts.filter(x=>x.completedAt).map(x=>x.lessonId));
 useEffect(()=>{fetch('/api/pilot',{cache:'no-store'}).then(r=>r.json()).then(d=>setState(d.state)).finally(()=>setLoading(false))},[]);
 if(loading)return <BrandLoader label="Loading teen dashboard"/>;
 return <main className="dashboardPage"><header className="dashboardHeader"><BrandLogo/><nav><Link href="/pilot">Journey</Link><Link href="/dashboard/parent">Parent dashboard</Link></nav></header><section className="dashboardHero"><div><span>TEEN DASHBOARD / VIBE</span><h1>Your road.<br/>Your next safe step.</h1><p>Build readiness with lessons, supervised practice and reflection. No driving streaks. No speed scores.</p></div><DashboardCustomizer storageKey="teensurance.teen.widgets" options={options} onChange={update}/></section>
 <div className="dashboardGrid">
 {widgets.includes('next_step')&&<section className="dashCard accentCard"><span>VIBE / NEXT</span><h2>{p.pending?'Ask your parent to review your pending drive':'Prepare your next practice intentionally'}</h2><p>{p.pending?'Pending practice does not count until family review.':'Choose one lesson or one driving skill, prepare while parked, then put the phone away.'}</p><Link href="/pilot">Open journey →</Link></section>}
 {widgets.includes('time')&&<TimeCalculator verifiedMinutes={p.verifiedMinutes} nightMinutes={p.nightMinutes} goalHours={state.goalHours}/>}
 {widgets.includes('passport')&&<section className="dashCard"><span>PASSPORT</span><h2>{passport.evidencePresent} / {passport.evidenceTotal} evidence areas</h2><p>{passport.nextSafeStep}</p><Link href="/pilot?tab=passport">View evidence →</Link></section>}
 {widgets.includes('recent_drives')&&<section className="dashCard"><span>MILES / RECENT</span><h2>Practice history</h2>{state.logs.slice(0,4).map(l=><p key={l.id}><strong>{l.skill}</strong> · {l.minutes} min · {l.status}</p>)}{!state.logs.length&&<p>No practice logged yet.</p>}</section>}
 {widgets.includes('safety')&&<section className="dashCard wideCard"><span>ACE / DRIVING LESSONS</span><h2>Learn before you practice.</h2><div className="lessonMiniGrid">{lessons.slice(0,4).map(l=><article key={l.id}><small>{l.id} · {l.status.replace('_',' ')}</small><strong>{l.title}</strong><p>{l.objective}</p></article>)}</div><Link href="/learn">Open all lessons & scenarios →</Link></section>}
 </div><HelpChat context="teen-dashboard"/></main>
}
