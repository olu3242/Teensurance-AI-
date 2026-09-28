import Link from 'next/link';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {concepts,challenges,validateContent} from '@/lib/roadready/content';
import {roadreadyEnabled} from '@/lib/roadready/service';
export const dynamic='force-dynamic';
export default function ContentInspection(){if(!roadreadyEnabled())return <main className="dashboardPage"><h1>RoadReady is disabled</h1></main>;const errors=validateContent(concepts,challenges,path=>existsSync(join(process.cwd(),'public',path)));
 return <main className="dashboardPage"><Link href="/admin">Platform admin</Link><h1>RoadReady content inspection</h1><p>Read-only public educational catalog. No learner data or editing permissions are exposed.</p><p>{concepts.length} concepts · {challenges.length} challenges · Validation: {errors.length?errors.join('; '):'passed'}</p><div style={{overflowX:'auto'}}><table><caption>Texas foundational pack</caption><thead><tr>{['Concept','Jurisdiction','Category','Difficulty','Active','Challenges','Asset','Source'].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{concepts.map(c=><tr key={c.id}><th scope="row">{c.name}</th><td>{c.jurisdiction}</td><td>{c.category}</td><td>{c.difficulty}</td><td>{c.active?'Yes':'No'}</td><td>{challenges.filter(q=>q.conceptId===c.id).length}</td><td><a href={c.imageAsset}>View SVG</a></td><td><a href={c.sourceUrl}>{c.sourceSection}</a></td></tr>)}</tbody></table></div></main>;
}
