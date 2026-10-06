'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';

const steps=[
 {id:'permit',label:'Permit',title:'Get oriented',detail:'Know the requirements, documents and family plan before the first practice session.'},
 {id:'learn',label:'Learn',title:'Build the knowledge',detail:'Use short lessons, road-sign practice and parked learning activities.'},
 {id:'practice',label:'Practice',title:'Practice with purpose',detail:'Log supervised sessions, night practice and the skill you worked on.'},
 {id:'license',label:'License',title:'Prepare the evidence',detail:'Organize completed requirements and confirm official licensing steps.'},
 {id:'covered',label:'Covered',title:'Prepare for coverage',detail:'Help the family prepare for insurance conversations without making underwriting decisions.'},
 {id:'further',label:'Go further',title:'Keep building confidence',detail:'Continue safe practice, reflection and independent-driving readiness.'}
];

export function DynamicJourneyFlow({waitlistMode=false,compact=false}:{waitlistMode?:boolean;compact?:boolean}){
 const [active,setActive]=useState(0);
 const [paused,setPaused]=useState(false);
 const prefersReduced=useMemo(()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,[]);
 useEffect(()=>{
  if(paused||prefersReduced)return;
  const timer=window.setInterval(()=>setActive(v=>(v+1)%steps.length),2200);
  return()=>window.clearInterval(timer);
 },[paused,prefersReduced]);
 const current=steps[active];
 const href=waitlistMode?'/waitlist':`/pilot?step=${Math.min(active,4)}`;
 return <section className={`dynamicJourney ${compact?'isCompact':''}`} aria-labelledby="dynamic-journey-title" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
  <div className="dynamicJourneyIntro">
   <p className="landing-eyebrow">YOUR ROAD / LIVE FLOW</p>
   <h2 id="dynamic-journey-title">One journey.<br/><span>Always moving.</span></h2>
   <p>The path advances as your family completes each step. Tap any stage to jump ahead and see what comes next.</p>
  </div>
  <div className="dynamicJourneyPanel">
   <ol aria-label="Teensurance journey steps">
    {steps.map((step,index)=><li key={step.id} className={index===active?'isActive':index<active?'isPassed':''}>
      <button type="button" aria-pressed={index===active} onClick={()=>{setActive(index);setPaused(true)}}><span className="dynamicJourneyDot">{String(index+1).padStart(2,'0')}</span><strong>{step.label}</strong></button>
    </li>)}
   </ol>
   <div className="dynamicJourneyCurrent" aria-live="polite">
    <span>{String(active+1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}</span>
    <h3>{current.title}</h3>
    <p>{current.detail}</p>
    <Link href={href}>{waitlistMode?'Join the waitlist':'Open this step'} <span aria-hidden="true">→</span></Link>
   </div>
  </div>
 </section>;
}
