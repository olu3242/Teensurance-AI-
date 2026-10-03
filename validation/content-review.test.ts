import {it,expect} from 'vitest';
import {existsSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {concepts,challenges,jurisdictionPack} from '../lib/roadready/content';
import {hazardScenes} from '../lib/roadready/core/hazards';
import {available} from '../lib/roadready/governance';
import {validateIntelligence} from '../lib/roadready/intelligence-validation';
it('exports a complete versioned review packet without inventing human approvals',()=>{
 expect(validateIntelligence(p=>existsSync(join(process.cwd(),'public',p)))).toEqual([]);
 const items=[...concepts.map(c=>({type:'concept',...c})),...challenges.map(q=>({type:'question',...q,jurisdiction:concepts.find(c=>c.id===q.conceptId)!.jurisdiction,sourceUrl:concepts.find(c=>c.id===q.conceptId)!.sourceUrl,version:concepts.find(c=>c.id===q.conceptId)!.version})),...hazardScenes.map(h=>({type:'hazard',...h}))].map(item=>({...item,productionReviewStatus:'REVIEW REQUIRED',contentDigest:createHash('sha256').update(JSON.stringify(item)).digest('hex')}));
 expect(items).toHaveLength(282);expect(new Set(items.map(i=>i.id)).size).toBe(282);
 writeFileSync('docs/ROADREADY_CONTENT_REVIEW_PACKET.json',JSON.stringify({status:'REVIEW REQUIRED',humanApproval:false,scope:'Catalog only; Guardian Coach templates, Scout explanations and Texas rule module also require human review',items},null,2)+'\n');
});
it('draft, review, approved and retired content are hidden; jurisdiction fallback remains explicit',()=>{
 for(const status of ['draft','review','approved','retired'] as const)expect(available([{...concepts[0],status}],'US-TX')).toEqual([]);
 expect(available([{...concepts[0],status:'published'}],'US-TX')).toHaveLength(1);expect(jurisdictionPack('OTHER').concepts).toEqual([]);
});
