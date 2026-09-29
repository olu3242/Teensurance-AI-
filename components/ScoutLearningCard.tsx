'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {Dashboard} from '@/lib/platform/types';
export function ScoutLearningCard({passport=false}:{passport?:boolean}){
 const [enabled,setEnabled]=useState(false);const [counts,setCounts]=useState<{state:string;count:number}[]>([]);
 useEffect(()=>{let active=true;async function load(){try{const availability=await fetch('/api/scout/availability').then(r=>r.json());if(!active)return;setEnabled(availability.enabled);if(!availability.enabled||!passport)return;const response=await fetch('/api/workspace');if(!response.ok)return;const w:Dashboard=await response.json();if(!w.household||!w.profiles.length||w.activeDrive)return;const r=await fetch(`/api/scout?householdId=${w.household.id}&teenId=${w.profiles[0].ownerId}`);if(!r.ok)return;const {data}=await r.json();if(active)setCounts(['introduced','practicing','demonstrated','reinforced'].map(state=>({state,count:data.mastery.filter((m:{state:string})=>m.state===state).length})))}catch{/* Existing dashboards stay usable when learning is unavailable. */}}void load();return()=>{active=false}},[passport]);
 if(!enabled)return null;
 return <section className="dashCard"><span>SCOUT / ROAD KNOWLEDGE</span><h2>{passport?'Road Knowledge & Awareness':'Build road knowledge'}</h2><p>{passport?'Educational evidence with learner and guardian provenance.':'Recognize signs, understand signals, and practice decisions while parked.'}</p>{counts.map(c=><p key={c.state}>{c.count} {c.state}</p>)}<Link href={`/teen/scout${passport?'#road-knowledge':''}`}>{passport?'Review learning evidence':'Open Scout Learning'} →</Link></section>;
}
