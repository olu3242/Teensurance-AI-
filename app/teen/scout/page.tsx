import {ScoutLearning} from '@/components/ScoutLearning';
import {scoutLearningEnabled} from '@/lib/scout/service';
import Link from 'next/link';
import '../roadready/roadready.css';
export const dynamic='force-dynamic';
export default function ScoutLearningPage(){return scoutLearningEnabled()?<ScoutLearning/>:<main className="dashboardPage"><h1>Scout Learning</h1><p>Scout Learning is not enabled for this pilot.</p><Link href="/pilot">Return to your journey</Link></main>}
