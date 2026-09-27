'use client';
import {useState} from 'react';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/client';
import {supabaseConfigured} from '@/lib/supabase/config';

export default function LoginPage(){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function google(){
  if(!supabaseConfigured()){setError('Google sign-in is waiting for the Teensurance Supabase project configuration.');return}
  setBusy(true);setError('');
  const supabase=createClient();const next=new URLSearchParams(window.location.search).get('next')||'/pilot';
  const redirectTo=`${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo}});
  if(error){setError(error.message);setBusy(false)}
 }
 return <main className="authPage"><Link href="/">← Teensurance</Link><section><span>FAMILY ACCESS</span><h1>Continue your driving journey.</h1><p>Sign in before joining or managing a family. Teensurance never uses Google profile metadata as an authorization role.</p><button onClick={google} disabled={busy}>{busy?'Connecting…':'Continue with Google'}</button>{error&&<p role="alert">{error}</p>}<small>Google OAuth must be enabled in the dedicated Teensurance Supabase project before this button can complete sign-in.</small></section></main>
}
