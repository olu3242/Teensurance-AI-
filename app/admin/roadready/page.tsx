import {ContentReview} from '@/components/ContentReview';
import {BrandLogo} from '@/components/BrandLogo';
import Link from 'next/link';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {concepts,challenges} from '@/lib/roadready/content';
import {validateIntelligence} from '@/lib/roadready/intelligence-validation';
import {hazardScenes} from '@/lib/roadready/core/hazards';
import {roadreadyEnabled} from '@/lib/roadready/service';
export const dynamic='force-dynamic';
export default function ContentInspection(){if(!roadreadyEnabled())return <main className="dashboardPage"><h1>Scout Learning is disabled</h1></main>;const errors=validateIntelligence(path=>existsSync(join(process.cwd(),'public',path)));
 return <main className="dashboardPage"><BrandLogo/><Link href="/admin">Platform admin</Link><h1>Scout Learning content inspection</h1><p>Read-only public educational catalog. No learner data or editing permissions are exposed.</p><p>{concepts.length} concepts · {challenges.length} challenges · Validation: {errors.length?errors.join('; '):'passed'}</p><div style={{overflowX:'auto'}}><table><caption>Texas foundational pack</caption><thead><tr>{['Concept','Jurisdiction','Category','Difficulty','Status','Version','Review date','Challenges','Asset','Source'].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{concepts.map(c=><tr key={c.id}><th scope="row">{c.name}</th><td>{c.jurisdiction}</td><td>{c.category}</td><td>{c.difficulty}</td><td>{c.status}</td><td>{c.version}</td><td>{c.reviewedAt||'No human review recorded'}</td><td>{challenges.filter(q=>q.conceptId===c.id).length}</td><td><a href={c.imageAsset}>View SVG</a></td><td><a href={c.sourceUrl}>{c.sourceSection}</a></td></tr>)}</tbody></table></div><ContentReview/><h2>Core hazard catalog</h2>{hazardScenes.map(h=><article key={h.id}><h3>{h.title}</h3><p>{h.id} · {h.jurisdiction} · {h.status} · {h.version} · {h.contentType}</p><p>Review: {h.reviewedAt||'No human review recorded'}</p><a href={h.sourceUrl}>{h.source}</a></article>)}</main>;
}
