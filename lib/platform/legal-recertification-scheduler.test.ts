import {describe,it,expect,vi,beforeEach} from 'vitest';
vi.mock('./db',()=>{const store=new Map<string,any[]>();return {all:async(k:string)=>store.get(k)||[],put:async(k:string,item:any)=>{const rows=store.get(k)||[];const i=rows.findIndex(x=>x.id===item.id);if(i>=0)rows[i]=item;else rows.push(item);store.set(k,rows);return item},__store:store}});
import {runScheduledLegalRecertification} from './legal-recertification-scheduler';
import {__store} from './db';
const source={id:'11111111-1111-4111-8111-111111111111',status:'superseded',jurisdiction:'CA'};
const promoted={id:'p',jurisdiction:'CA',version:'1',sourceIds:[source.id],rule:{id:'ca-1',validUntil:'2027-01-01T00:00:00Z'}};
describe('scheduled legal recertification',()=>{
 beforeEach(()=>{(__store as Map<string,any[]>).clear();(__store as Map<string,any[]>).set('promoted_legal_rule',[promoted]);(__store as Map<string,any[]>).set('legal_source_candidate',[source])});
 it('opens a fail-closed impact and records the scheduled run',async()=>{const result=await runScheduledLegalRecertification(new Date('2026-10-03T00:00:00Z'));expect(result).toMatchObject({scanned:1,open:1});const impacts=(__store as Map<string,any[]>).get('legal_recertification_impact')||[];expect(impacts[0]).toMatchObject({jurisdiction:'CA',status:'open',ownerId:'system:legal-recertification'});expect(((__store as Map<string,any[]>).get('legal_recertification_run')||[])).toHaveLength(1)});
 it('does not create legal review or publication records',async()=>{await runScheduledLegalRecertification(new Date('2026-10-03T00:00:00Z'));expect((__store as Map<string,any[]>).get('legal_rule_review')).toBeUndefined()});
});
