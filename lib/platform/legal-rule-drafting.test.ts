import {describe,it,expect,vi,beforeEach} from 'vitest';
import type {User} from './types';
vi.mock('./admin',()=>({requireReviewer:()=>undefined}));
vi.mock('./db',()=>{const store=new Map<string,any[]>();return {all:async(k:string)=>store.get(k)||[],put:async(k:string,item:any)=>{const rows=store.get(k)||[];const i=rows.findIndex(x=>x.id===item.id);if(i>=0)rows[i]=item;else rows.push(item);store.set(k,rows);return item},__store:store}});
import {saveLegalRuleDraft,markLegalRuleDraftReady} from './legal-rule-drafting';
import {__store} from './db';
const user={id:'reviewer'} as User;
const source={id:'11111111-1111-4111-8111-111111111111',householdId:'',ownerId:'reviewer',jurisdiction:'CA',stateName:'California',authority:'California DMV',sourceTitle:'Teen drivers',sourceUrl:'https://www.dmv.ca.gov/',sourceType:'dmv',priority:1,status:'accepted',note:'verified',createdAt:'2026-10-03T00:00:00Z',updatedAt:'2026-10-03T00:00:00Z'};
const draft=(sourceId=source.id)=>({jurisdiction:'CA',version:'2026.10.1',effectiveFrom:'2026-10-03',validUntil:'2027-01-03T00:00:00.000Z',minimumAge:16,holdingMonths:6,totalMinutes:3000,nightMinutes:600,requiredEvidence:['documents'],requirements:[{id:'ca-practice',kind:'practice',label:'Structured source-backed practice requirement.',sourceId,citationNote:'Reviewer mapped this requirement to the official source.'}]});
describe('legal rule drafting workbench',()=>{
 beforeEach(()=>{(__store as Map<string,any[]>).clear();(__store as Map<string,any[]>).set('legal_source_candidate',[{...source}])});
 it('preserves accepted source provenance on every requirement',async()=>{const saved=await saveLegalRuleDraft(user,draft());expect(saved.requirements[0]).toMatchObject({sourceId:source.id,sourceUrl:source.sourceUrl,authority:source.authority});expect(saved.status).toBe('draft')});
 it('rejects uncited or unaccepted source mappings',async()=>{await expect(saveLegalRuleDraft(user,draft('22222222-2222-4222-8222-222222222222'))).rejects.toThrow('accepted official source')});
 it('cannot mark a draft ready without human provenance attestation',async()=>{const saved=await saveLegalRuleDraft(user,draft());await expect(markLegalRuleDraftReady(user,saved.id,false)).rejects.toThrow('Human provenance attestation');const ready=await markLegalRuleDraftReady(user,saved.id,true);expect(ready.status).toBe('ready_for_rule_review')});
 it('fails ready transition if a cited source loses accepted status',async()=>{const saved=await saveLegalRuleDraft(user,draft());(__store as Map<string,any[]>).set('legal_source_candidate',[{...source,status:'superseded'}]);await expect(markLegalRuleDraftReady(user,saved.id,true)).rejects.toThrow('no longer accepted')});
});
