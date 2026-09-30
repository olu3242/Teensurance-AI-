'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import './landing.css';
import {SiteHeader} from '@/components/SiteHeader';
import {SiteFooter} from '@/components/SiteFooter';
import {HelpChat} from '@/components/HelpChat';
import {DynamicJourneyFlow} from '@/components/DynamicJourneyFlow';

function Arrow() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

const stories = [
  { number: '01', title: <>Build<br />confidence</>, description: 'Supervised practice, one drive at a time.', image: 'driver', alt: 'Young driver focusing on the road in the evening light.' },
  { number: '02', title: <>A clearer<br />path ahead</>, description: 'Know what’s next for licensing and insurance.', image: 'family', alt: 'A father and son preparing for a practice drive together.' },
];
 
export default function LandingPage() {
  const [slide, setSlide] = useState(0);
  const waitlistMode=process.env.NEXT_PUBLIC_WAITLIST_MODE!=='false';

  return (
    <div className="landing">
      <a className="landing-skip" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main">
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-intro">
            <p className="landing-eyebrow">TEENSURANCE AI</p>
            <h1 id="hero-heading">YOUR ROAD<br /><span>STARTS HERE<span className="landing-period">.</span></span></h1>
            <p className="landing-tagline">Know what’s next. Track your progress. Get there safely.</p>
            <p className="landing-description">From first permit to confident driving, Teensurance helps<br className="landing-desktop-break" /> young drivers and their families navigate every step ahead.</p>
            <div className="landing-actions">{waitlistMode?<><Link href="/waitlist" className="landing-button">Join the waitlist <Arrow /></Link><span className="landing-parent" style={{borderBottom:0,color:'var(--muted)'}}>Pilot access is currently closed</span></>:<><Link href="/auth/login?next=%2Fpilot" className="landing-button">Start my journey <Arrow /></Link><Link href="/join" className="landing-parent">I have an invite</Link></>}</div>
          </div>
          <div className="landing-stories" role="region" aria-roledescription="carousel" aria-label="Your road ahead">
            <div className="landing-story-grid" aria-live="polite">
              {[stories[slide], stories[1 - slide]].map(story => (
                <article key={story.number} className="landing-story">
                  <div className={`landing-photo landing-photo-${story.image}`}><Image src="/images/driving-stories.png" alt={story.alt} fill priority sizes="(max-width: 700px) 100vw, 50vw" /></div>
                  <div className="landing-story-shade" />
                  <div className="landing-story-copy"><span className="landing-story-number">{story.number}</span><h2>{story.title}</h2><p>{story.description}</p></div>
                </article>
              ))}
            </div>
            <button className="landing-carousel-arrow landing-carousel-prev" aria-label="Previous story" onClick={() => setSlide(current => 1 - current)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7" stroke="currentColor" strokeWidth="1.8" /></svg></button>
            <button className="landing-carousel-arrow landing-carousel-next" aria-label="Next story" onClick={() => setSlide(current => 1 - current)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" /></svg></button>
            <div className="landing-carousel-dots">{stories.map((story, index) => <button key={story.number} aria-label={`Show story ${index + 1} first`} aria-pressed={slide === index} className={slide === index ? 'is-active' : ''} onClick={() => setSlide(index)} />)}</div>
          </div>
        </section>
        <div id="how-it-works"><DynamicJourneyFlow waitlistMode={waitlistMode}/></div>
        <section className="landing-miles" id="about" aria-labelledby="miles-heading">
          <div className="landing-miles-inner">
            <div className="landing-miles-intro"><p className="landing-eyebrow">MILES</p><h2 id="miles-heading">TRACK THE<br />HOURS.<br /><span>NOT THE MATH.</span></h2><p className="landing-miles-description">Start the drive. Put the phone away.<br />We’ll keep the session organized.</p><Link href="/pilot?mode=drive" className="landing-button">Start drive <Arrow /></Link></div>
            <div className="landing-practice" aria-label="Example practice progress"><div className="landing-practice-total">31h<br />45m</div><p className="landing-verified">Verified practice <svg width="23" height="23" viewBox="0 0 24 24" aria-label="Verified"><path fill="#3ac8f5" d="m12 1 4 2 4 1 1 4 2 4-2 4-1 4-4 1-4 2-4-2-4-1-1-4-2-4 2-4 1-4 4-1Z" /><path d="m8 12 3 3 5-6" fill="none" stroke="#092031" strokeWidth="1.5" /></svg></p><dl><div><dt>Day</dt><dd>25h 15m</dd></div><div><dt>Night</dt><dd>6h 30m</dd></div><div><dt>Remaining</dt><dd>8h 15m</dd></div></dl></div>
            <div className="landing-drive-preview" aria-label="Example drive mode"><p className="landing-drive-label">Drive mode</p><div className="landing-timer">00:42</div><h3>EYES UP.<br />PHONE DOWN.</h3><p className="landing-drive-caption">WE’VE GOT THE LOG.</p><span className="landing-drive-rule" /><p className="landing-drive-note">No chat. No streaks. No distractions.</p></div>
          </div>
          <p className="landing-example-note">Illustrative practice progress. Your family’s goal and local licensing requirements may differ.</p>
        </section>
                <section className="landing-faq" id="faq" aria-labelledby="faq-heading">
          <div className="landing-faq-intro"><p className="landing-eyebrow">FAQ / THE BASICS</p><h2 id="faq-heading">Questions before<br/><span>you hit the road.</span></h2><p>Clear answers for teens and families. For local licensing requirements, always confirm with the official authority for your jurisdiction.</p></div>
          <div className="landing-faq-list">
            <details><summary>What does Teensurance actually do?<span>+</span></summary><p>It organizes the journey from learner to independent driver: preparation, supervised practice, family review, readiness evidence and insurance preparation.</p></details>
            <details><summary>Does Teensurance decide when I am legally ready for a license?<span>+</span></summary><p>No. The Readiness Passport organizes evidence; it is not an official licensing decision. Jurisdiction requirements must come from reviewed official sources.</p></details>
            <details><summary>Can I use the app while I am driving?<span>+</span></summary><p>No. GUARD is designed around phone-down driving. Prepare before moving, drive without app engagement, then log and reflect after you are safely parked.</p></details>
            <details><summary>How do family invitations work?<span>+</span></summary><p>A guardian creates an invitation for the household. The invited person signs in and redeems that invitation before receiving household access.</p></details>
            <details><summary>What is a referral code?<span>+</span></summary><p>A referral code records attribution only. It never grants household access, changes a user role, or affects licensing or insurance status.</p></details>
            <details><summary>Does Teensurance sell or recommend insurance?<span>+</span></summary><p>Not in this MVP. COVER helps families prepare for insurance conversations, but Teensurance does not quote, bind, underwrite, rank carriers or determine eligibility.</p></details>
          </div>
        </section>
      </main>
      <SiteFooter />
      <HelpChat context="landing" />
    </div>
  );
}
