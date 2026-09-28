import {RoadReady} from '@/components/RoadReady';
import {roadreadyEnabled} from '@/lib/roadready/service';
import Link from 'next/link';
import './roadready.css';
export const dynamic='force-dynamic';
export default function RoadReadyPage(){return roadreadyEnabled()?<RoadReady/>:<main className="dashboardPage"><h1>RoadReady Learning</h1><p>RoadReady is not enabled for this pilot.</p><Link href="/pilot">Return to your journey</Link></main>}
