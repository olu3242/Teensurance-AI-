import {describe,it,expect,vi,beforeEach} from 'vitest';
import type {User} from './types';
vi.mock('./admin',()=>({requireReviewer:()=>undefined}));
vi.mock('./db',()=>{const store=new Map<string,any[]>();return {all:async(k:string)=>store.get(k)||[],put:async(k:string,item:any)=>{const rows=store.get(k)||[];const i=rows.findIndex(x=>x.id===item.id);if(i>=0)rows[i]=item;else rows.push(item);store.set(k,rows);return item},transaction:async(fn:any)=>fn(),__store:store}});
import {promoteLegalRuleDraft} from './legal-rule-promotion';
import {__store} from './db';
const user={id:'reviewer'} as User;
const source={id:'11111111-1111-4111-8111-111111111111',status:'accepted',jurisdiction:'CA',sourceUrl:'https://www.dmv.ca.gov/',sourceTitle:'Teen drivers',authority:'California DMV'};
const draft={id:'draft-1',householdId:'',ownerId:'reviewer',jurisdiction:'CA',stateName:'California',status:'ready_for_rule_review',sourceIds:[source.id],requirements:[{id:'req',kind:'practice',label:'Source-backed practice requirement.',sourceId:source.id,sourceUrl:source.sourceUrl,sourceTitle:source.sourceTitle,authority:source.authority,citationNote:'Mapped by human reviewer.'}],version:'2026.10.1',effectiveFrom:'2026-10-03',validUntil:'2027-01-03T00:00:00.000Z',minimumAge:16,holdingMonths:6,totalMinutes:3000,nightMinutes:600,requiredEvidence:['documents'],createdAt:'',updatedAt:''};
describe('legal rule promotion gate',()=>{
 beforeEach(()=>{(__store as Map<string,any[]>).clear();(__store as Map<string,any[]>).set('legal_rule_draft',[{...draft}]);(__store as Map<string,any[]>).set('legal_source_candidate',[{...source}])});
 it('promotes a ready draft only as an unpublished governed candidate',async()=>{const p=await promoteLegalRuleDraft(user,draft.id,true);expect(p.rule).toMatchObject({jurisdiction:'CA',lifecycleStatus:'draft',status:'verified'});expect(p.provenance[0]).toMatchObject({sourceId:source.id,requirementId:'req'});expect(p.rule.legalRequirements?.[0]).not.toHaveProperty('sourceId')});
 it('requires explicit human promotion attestation',async()=>{await expect(promoteLegalRuleDraft(user,draft.id,false)).rejects.toThrow('Human promotion attestation')});
 it('rejects promotion when an underlying source is no longer accepted',async()=>{(__store as Map<string,any[]>).set('legal_source_candidate',[{...source,status:'superseded'}]);await expect(promoteLegalRuleDraft(user,draft.id,true)).rejects.toThrow('remain accepted')});
 it('is idempotent for the same jurisdiction and version',async()=>{const a=await promoteLegalRuleDraft(user,draft.id,true);const b=await promoteLegalRuleDraft(user,draft.id,true);expect(b.id).toBe(a.id)});
});
