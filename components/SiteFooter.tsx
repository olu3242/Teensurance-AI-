import Link from 'next/link';
import {BrandLogo} from './BrandLogo';

export function SiteFooter() {
 return <footer className="siteFooter">
  <div className="siteFooterBrand"><BrandLogo inverse/><p>Helping families build safer, clearer paths from learner to independent driver.</p></div>
  <nav aria-label="Footer navigation">
   <Link href="/#how-it-works">How it works</Link>
   <Link href="/#faq">FAQ</Link>
   <Link href="/join">Join a family</Link>
   <Link href="/auth/login">Log in</Link>
  </nav>
  <div className="siteFooterSafety"><strong>GUARD</strong><span>No chat or prompts while driving.</span></div>
  <p className="siteFooterLegal">Teensurance provides journey organization and educational guidance. Licensing and insurance decisions must be confirmed with official or licensed sources.</p>
 </footer>;
}
