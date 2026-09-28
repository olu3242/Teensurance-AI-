'use client';
import {FormEvent,useState} from 'react';

import {BrandLogo} from '@/components/BrandLogo';
import {HelpChat} from '@/components/HelpChat';
export default function JoinPage(){
 const [code,setCode]=useState('');const [referral,setReferral]=useState('');const message='';
 async function submit(e:FormEvent){e.preventDefault();const params=new URLSearchParams();if(code)params.set('invite',code.trim().toUpperCase());if(referral)params.set('ref',referral.trim().toUpperCase());window.location.href=`/auth/login?next=${encodeURIComponent('/join/complete?'+params.toString())}`;}
 return <main className="authPage"><BrandLogo /><form onSubmit={submit}><span>JOIN A FAMILY</span><h1>Use your invitation.</h1><p>Invitation codes connect an authenticated person to a household. Referral codes only record attribution and never grant access.</p><label>Invitation code<input required placeholder="INV-XXXXXXXX" value={code} onChange={e=>setCode(e.target.value)}/></label><label>Referral code <small>optional</small><input placeholder="REF-XXXXXXXX" value={referral} onChange={e=>setReferral(e.target.value)}/></label><button>Continue securely</button>{message&&<p>{message}</p>}</form><HelpChat context="join" /></main>
}
