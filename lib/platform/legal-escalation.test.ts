import {describe,it,expect,vi,beforeEach} from 'vitest';
vi.mock('./admin',()=>({requireReviewer:()=>undefined}));
vi.mock('./db',()=>{const store=new Map<string,any[]>();return {all:async(k:string)=>store.get(k)||[],put:async(k:string,item:any)=>{const rows=store.get(k)||[];const i=rows.findIndex(x=>x.id===item.id);if(i>=0)rows[i]=item;else rows.push(item);store.set(k,rows);return item},__store:store}});
import {severityForImpact,dueAtForSeverity,upsertLegalEscalations,transitionLegalEscalation} from './legal-escalation';
import {__store} from './db';
import type {User} from './types';
const impact=(reasons:any[])=>({id:'11111111-1111-4111-8111-111111111111',jurisdiction:'CA',ruleId:'ca-1',version:'1',status:'open',reasons,sourceIds:[],affected:['state_experience','journey','passport','scout','roadready'],detectedAt:'2026-10-03T00:00:00Z',note:'recertification required'});
describe('legal escalation',()=>{
 beforeEach(()=>{(__store as Map<string,any[]>).clear()});
 it('assigns critical severity to missing or rejected authority',()=>{expect(severityForImpact(impact(['source_missing']) as any)).toBe('critical');expect(dueAtForSeverity('critical',new Date('2026-10-03T00:00:00Z'))).toBe('2026-10-04T00:00:00.000Z')});
 it('assigns high severity to source supersession and expiry',()=>{expect(severityForImpact(impact(['source_superseded']) as any)).toBe('high')});
 it('creates one operational alert per open impact without duplicating it',async()=>{const first=await upsertLegalEscalations([impact(['source_missing']) as any],new Date('2026-10-03T00:00:00Z'));const second=await upsertLegalEscalations([impact(['source_missing']) as any],new Date('2026-10-03T01:00:00Z'));expect(second[0].id).toBe(first[0].id);expect((__store as Map<string,any[]>).get('legal_escalation')).toHaveLength(1)});
 it('requires reviewer action to acknowledge and resolve',async()=>{const [alert]=await upsertLegalEscalations([impact(['source_expired']) as any],new Date('2026-10-03T00:00:00Z'));const user={id:'reviewer'} as User;const ack=await transitionLegalEscalation(user,{id:alert.id,action:'acknowledge',note:'Reviewer owns this recertification.'});expect(ack.status).toBe('acknowledged');const done=await transitionLegalEscalation(user,{id:alert.id,action:'resolve',note:'Operational follow-up completed.'});expect(done.status).toBe('resolved')});
});
