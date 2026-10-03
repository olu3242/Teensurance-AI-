'use client';
import Link from 'next/link';
import {useState} from 'react';
import {BrandLogo} from './BrandLogo';

export function SiteHeader() {
  const [open,setOpen]=useState(false);
  const waitlistMode=process.env.NEXT_PUBLIC_WAITLIST_MODE!=='false';
  const close=()=>setOpen(false);
  if(waitlistMode)return <header className="siteHeader"><BrandLogo href="/"/><div className="siteActions" style={{marginLeft:'auto'}}><Link href="/waitlist" className="sitePrimary">Join waitlist <span aria-hidden="true">→</span></Link></div></header>;
  return <header className="siteHeader">
    <BrandLogo />
    <button className="siteMenuButton" aria-expanded={open} aria-controls="site-nav" onClick={()=>setOpen(v=>!v)}>{open?'Close':'Menu'} <span aria-hidden="true">{open?'−':'+'}</span></button>
    <nav id="site-nav" className={`siteNav ${open?'isOpen':''}`} aria-label="Main navigation">
      <Link href="/auth/login?next=%2Fpilot" onClick={close}>For teens</Link>
      <Link href="/auth/login?next=%2Fpilot%3Frole%3Dparent%26tab%3Dfamily" onClick={close}>For parents</Link>
      <Link href="/#how-it-works" onClick={close}>How it works</Link>
      <Link href="/learn" onClick={close}>Driving lessons</Link>
      <Link href="/#faq" onClick={close}>FAQ</Link>
      <Link href="/waitlist" onClick={close}>Waitlist</Link>
    </nav>
    <div className="siteActions">
      <Link href="/join" className="siteTextLink">Join family</Link>
      <Link href="/auth/login" className="sitePrimary">Log in <span aria-hidden="true">→</span></Link>
    </div>
  </header>;
}
