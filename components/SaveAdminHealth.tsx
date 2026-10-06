'use client';
import {useEffect,useState} from 'react';

type Health={
 carrierAdapters:{configured:number|null;configurationValid:boolean};
 persistence:Record<string,number>;
 hostedPersistenceExpected:boolean;
 postgresConfigured:boolean;
 emailProviderConfigured:boolean;
 cronSecretConfigured:boolean;
};

export function SaveAdminHealth(){
 const [data,setData]=useState<Health>();const [error,setError]=useState('');
 useEffect(()=>{fetch('/api/admin/save-health',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load SAVE health.');setData(d)}).catch(e=>setError(e.message))},[]);
 if(error)return <section><h2>SAVE operations</h2><p role="alert">{error}</p></section>;
 if(!data)return <section><h2>SAVE operations</h2><p>Loading SAVE operational health…</p></section>;
 const status=(ok:boolean)=>ok?'READY':'BLOCKED';
 return <section>
  <h2>SAVE operations</h2>
  <p>Configuration and persistence health only. No insurance underwriting metrics are shown.</p>
  <div className="adminStats">
   <div><small>PostgreSQL</small><strong>{status(data.postgresConfigured)}</strong></div>
   <div><small>Email</small><strong>{status(data.emailProviderConfigured)}</strong></div>
   <div><small>Cron</small><strong>{status(data.cronSecretConfigured)}</strong></div>
  </div>
  <p><strong>Carrier adapters:</strong> {data.carrierAdapters.configurationValid?(data.carrierAdapters.configured??0)+' configured':'invalid configuration'}</p>
  <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(data.persistence,null,2)}</pre>
 </section>;
}
