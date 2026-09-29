import {ScoutLearning} from '@/components/ScoutLearning';
import {BrandLogo} from '@/components/BrandLogo';
import {scoutLearningEnabled} from '@/lib/scout/service';
import Link from 'next/link';
import '../roadready/roadready.css';
export const dynamic='force-dynamic';
export default function ScoutLearningPage(){return scoutLearningEnabled()?<><header className="dashboardHeader"><BrandLogo/></header><ScoutLearning/></>:<main className="dashboardPage"><BrandLogo/><h1>Scout Learning</h1><p>Scout Learning is not enabled for this pilot.</p><Link href="/pilot">Return to your journey</Link></main>}
