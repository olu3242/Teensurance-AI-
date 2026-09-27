'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import './landing.css';

function Arrow() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

const stories = [
  { number: '01', title: <>Build<br />confidence</>, description: 'Supervised practice, one drive at a time.', image: 'driver', alt: 'Young driver focusing on the road in the evening light.' },
  { number: '02', title: <>A clearer<br />path ahead</>, description: 'Know what’s next for licensing and insurance.', image: 'family', alt: 'A father and son preparing for a practice drive together.' },
];
const milestones = ['Permit', 'Learn', 'Practice', 'License', 'Covered', 'Go further'];

export default function LandingPage() {
  const [slide, setSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="landing">
      <a className="landing-skip" href="#main">Skip to content</a>
      <header className="landing-header">
        <Link href="/" className="landing-brand" aria-label="Teensurance home"><span className="landing-mark" aria-hidden="true" /><span>TEENSURANCE</span></Link>
        <button className="landing-menu" aria-expanded={menuOpen} aria-controls="landing-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'} <span aria-hidden="true">{menuOpen ? '−' : '+'}</span></button>
        <nav id="landing-nav" className={menuOpen ? 'landing-nav is-open' : 'landing-nav'} aria-label="Main navigation">
          <Link href="/pilot" onClick={() => setMenuOpen(false)}>For Teens</Link>
          <Link href="/pilot?role=parent&tab=family" onClick={() => setMenuOpen(false)}>For Parents</Link>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>
        <div className="landing-account"><Link href="/join" className="landing-login">Join family</Link><Link href="/auth/login" className="landing-button landing-button-small">Log in <Arrow /></Link></div>
      </header>
      <main id="main">
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-intro">
            <p className="landing-eyebrow">TEENSURANCE AI</p>
            <h1 id="hero-heading">YOUR ROAD<br /><span>STARTS HERE<span className="landing-period">.</span></span></h1>
            <p className="landing-tagline">Know what’s next. Track your progress. Get there safely.</p>
            <p className="landing-description">From first permit to confident driving, Teensurance helps<br className="landing-desktop-break" /> young drivers and their families navigate every step ahead.</p>
            <div className="landing-actions"><Link href="/auth/login?next=%2Fpilot" className="landing-button">Start my journey <Arrow /></Link><Link href="/join" className="landing-parent">I have an invite</Link></div>
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
        <nav id="how-it-works" className="landing-roadmap" aria-label="The driving journey">
          <ol>{milestones.map((milestone, index) => <li key={milestone} className={index < 2 ? 'is-complete' : index === 2 ? 'is-current' : ''}><Link href={`/pilot?step=${Math.min(index, 4)}`}><span className="landing-milestone-dot" aria-hidden="true">{index < 2 ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.6" /></svg> : null}</span><span className="landing-milestone-label"><span>0{index + 1}</span><strong>{milestone}</strong></span></Link></li>)}</ol>
          <span className="landing-roadmap-arrow" aria-hidden="true"><Arrow /></span>
        </nav>
        <section className="landing-miles" id="about" aria-labelledby="miles-heading">
          <div className="landing-miles-inner">
            <div className="landing-miles-intro"><p className="landing-eyebrow">MILES</p><h2 id="miles-heading">TRACK THE<br />HOURS.<br /><span>NOT THE MATH.</span></h2><p className="landing-miles-description">Start the drive. Put the phone away.<br />We’ll keep the session organized.</p><Link href="/pilot?mode=drive" className="landing-button">Start drive <Arrow /></Link></div>
            <div className="landing-practice" aria-label="Example practice progress"><div className="landing-practice-total">31h<br />45m</div><p className="landing-verified">Verified practice <svg width="23" height="23" viewBox="0 0 24 24" aria-label="Verified"><path fill="#3ac8f5" d="m12 1 4 2 4 1 1 4 2 4-2 4-1 4-4 1-4 2-4-2-4-1-1-4-2-4 2-4 1-4 4-1Z" /><path d="m8 12 3 3 5-6" fill="none" stroke="#092031" strokeWidth="1.5" /></svg></p><dl><div><dt>Day</dt><dd>25h 15m</dd></div><div><dt>Night</dt><dd>6h 30m</dd></div><div><dt>Remaining</dt><dd>8h 15m</dd></div></dl></div>
            <div className="landing-drive-preview" aria-label="Example drive mode"><p className="landing-drive-label">Drive mode</p><div className="landing-timer">00:42</div><h3>EYES UP.<br />PHONE DOWN.</h3><p className="landing-drive-caption">WE’VE GOT THE LOG.</p><span className="landing-drive-rule" /><p className="landing-drive-note">No chat. No streaks. No distractions.</p></div>
          </div>
          <p className="landing-example-note">Illustrative practice progress. Your family’s goal and local licensing requirements may differ.</p>
        </section>
      </main>
    </div>
  );
}
