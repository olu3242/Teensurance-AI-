import {hazardScenes} from './core/hazards';
import {concepts,challenges,validateContent} from './content';
import {contentStatuses,available} from './governance';
export function validateIntelligence(assetExists:(path:string)=>boolean){
 const errors=validateContent(concepts,challenges,assetExists);const ids=new Set<string>();
 for(const h of hazardScenes){if(ids.has(h.id))errors.push(`Duplicate hazard ${h.id}`);ids.add(h.id);if(!h.version||!h.source||!h.sourceUrl||!contentStatuses.includes(h.status)||h.jurisdiction!=='CORE')errors.push(`Invalid hazard metadata ${h.id}`);if(!assetExists(h.imageAsset))errors.push(`Missing hazard asset ${h.id}`);if(!h.targetIds.length||h.targetIds.some(id=>!h.hazardTargets.some(t=>t.id===id))||!h.responseOptions.some(r=>r.id===h.responseId))errors.push(`Invalid hazard references ${h.id}`)}
 if(available(concepts,'US-CA').some(c=>c.jurisdiction==='US-TX'))errors.push('Texas leakage');return errors;
}
