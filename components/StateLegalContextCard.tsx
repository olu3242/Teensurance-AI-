'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {Dashboard} from '@/lib/platform/types';

export function StateLegalContextCard(){
 const [data,setData]=useState<Dashboard|null>(null);
 useEffect(()=>{fetch('/api/workspace',{cache:'no-store'}).then(async r=>r.ok?setData(await r.json()):undefined).catch(()=>undefined)},[]);
 const journey=data?.journeys[0];const x=journey?.stateExperience;
 if(!x)return <section className="dashCard"><span>STATE REQUIREMENTS</span><h2>Official source required</h2><p>Select a supported licensing state in your driver profile to see the reviewed requirements that apply to this journey.</p><Link href="/pilot?tab=profile">Review driver profile →</Link></section>;
 return <section className="dashCard"><span>{x.stateName.toUpperCase()} / LEGAL CONTEXT</span><h2>{x.stateName} requirements</h2><p>{x.legalRequirements.length} reviewed requirements apply to the current {x.stage.replace('-',' ')} stage.</p>{journey?.practice&&<p>{Math.floor(journey.practice.verified.verifiedMinutes/60)}h {journey.practice.verified.verifiedMinutes%60}m verified of {Math.floor(journey.practice.required.verifiedMinutes/60)}h {journey.practice.required.verifiedMinutes%60}m in the state practice snapshot.</p>}<p><small>{x.boundary}</small></p><Link href="/pilot">View requirements and official source →</Link></section>;
}
