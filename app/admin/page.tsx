'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {BrandLogo} from '@/components/BrandLogo';import {BrandLoader} from '@/components/BrandLoader';import {DashboardCustomizer} from '@/components/DashboardCustomizer';import {defaultDashboardPreferences} from '@/lib/dashboard-config';
type Status={counts:{events:number;audits:number;openReviews:number;openExceptions:number;pendingSources:number;workflowInstances:number};workflows:unknown[];recentEvents:unknown[];inbox:{openReviews:unknown[];openExceptions:unknown[];pendingSources:unknown[]}};
const options=[{id:'system',label:'System status'},{id:'operations',label:'Operations'},{id:'workflows',label:'Workflow instances'},{id:'reviews',label:'Human review'},{id:'events',label:'Recent events'}];
export default function AdminPage(){
 const [data,setData]=useState<Status|null>(null);const [widgets,setWidgets]=useState<string[]>(defaultDashboardPreferences.admin);const update=useCallback((x:string[])=>setWidgets(x),[]);
 useEffect(()=>{fetch('/api/os/status',{cache:'no-store'}).then(r=>r.json()).then(setData)},[]);
 if(!data)return <BrandLoader label="Loading platform operations"/>;
 return <main className="dashboardPage adminPage"><header className="dashboardHeader"><BrandLogo/><nav><Link href="/">Public site</Link><Link href="/pilot">Pilot</Link></nav></header><section className="dashboardHero"><div><span>PLATFORM ADMIN / OPERATIONS</span><h1>See the system.<br/>Don’t bypass it.</h1><p>Operational visibility for workflows, reviews, exceptions and events. This local console is read-only until production admin authentication exists.</p></div><DashboardCustomizer storageKey="teensurance.admin.widgets" options={options} onChange={update}/></section><div className="dashboardGrid">
 {widgets.includes('system')&&<section className="dashCard accentCard"><span>SYSTEM</span><h2>Local MVP operations</h2><p>Admin mutations are intentionally disabled. Production requires a separately authenticated platform-admin role.</p></section>}
 {widgets.includes('operations')&&<section className="dashCard"><span>COUNTS</span><div className="adminStats">{Object.entries(data.counts).map(([k,v])=><div key={k}><strong>{v}</strong><small>{k.replace(/([A-Z])/g,' $1')}</small></div>)}</div></section>}
 {widgets.includes('reviews')&&<section className="dashCard"><span>HUMAN REVIEW</span><h2>{data.inbox.openReviews.length+data.inbox.openExceptions.length+data.inbox.pendingSources.length} items need attention</h2><p>Requirement-source candidates must remain pending until reviewed by an authorized human.</p></section>}
 {widgets.includes('workflows')&&<section className="dashCard wideCard"><span>WORKFLOW INSTANCES</span><pre>{JSON.stringify(data.workflows,null,2)}</pre></section>}
 {widgets.includes('events')&&<section className="dashCard wideCard"><span>RECENT EVENTS</span><pre>{JSON.stringify(data.recentEvents,null,2)}</pre></section>}
 </div></main>
}
