import {describe,it,expect,vi,beforeEach} from 'vitest';
import type {User} from './types';

vi.mock('./admin',()=>({requireReviewer:()=>undefined}));
vi.mock('./db',()=>{const rows:any[]=[];return {all:async()=>rows,put:async(_t:string,item:any)=>{const i=rows.findIndex(x=>x.id===item.id);if(i>=0)rows[i]=item;else rows.push(item);return item},__rows:rows}});
import {queueLegalSource,transitionLegalSource} from './legal-source-queue';
import {__rows} from './db';
const user={id:'reviewer'} as User;

describe('legal source ingestion queue',()=>{
 beforeEach(()=>{(__rows as any[]).splice(0)});
 it('queues an official source without publishing legal guidance',async()=>{
  const item=await queueLegalSource(user,{jurisdiction:'CA',authority:'California DMV',sourceTitle:'Teen drivers',sourceUrl:'https://www.dmv.ca.gov/',sourceType:'dmv',priority:1,note:'Candidate official source'});
  expect(item).toMatchObject({jurisdiction:'CA',stateName:'California',status:'queued'});
 });
 it('rejects non-HTTPS and unsupported jurisdiction candidates',async()=>{
  await expect(queueLegalSource(user,{jurisdiction:'CA',authority:'DMV',sourceTitle:'Teen drivers',sourceUrl:'http://example.com',sourceType:'dmv',priority:1,note:''})).rejects.toThrow('Invalid legal-source candidate');
  await expect(queueLegalSource(user,{jurisdiction:'OTHER',authority:'Authority',sourceTitle:'Teen drivers',sourceUrl:'https://example.gov/',sourceType:'official_guidance',priority:1,note:''})).rejects.toThrow('supported U.S. states');
 });
 it('requires retrieval and human review before accepting a source',async()=>{
  const item=await queueLegalSource(user,{jurisdiction:'NY',authority:'New York DMV',sourceTitle:'Young drivers',sourceUrl:'https://dmv.ny.gov/',sourceType:'dmv',priority:1,note:''});
  await expect(transitionLegalSource(user,{id:item.id,to:'accepted',note:'Reviewed official source carefully.',humanAttestation:true})).rejects.toThrow('Invalid legal-source transition');
  await transitionLegalSource(user,{id:item.id,to:'retrieved',note:'Retrieved official source snapshot.',humanAttestation:false});
  await transitionLegalSource(user,{id:item.id,to:'reviewing',note:'Reviewing source and effective dates.',humanAttestation:false});
  await expect(transitionLegalSource(user,{id:item.id,to:'accepted',note:'Reviewed official source carefully.',humanAttestation:false})).rejects.toThrow('Human source-review attestation');
  const accepted=await transitionLegalSource(user,{id:item.id,to:'accepted',note:'Human verified authority, scope and dates.',humanAttestation:true});
  expect(accepted.status).toBe('accepted');
  expect(accepted.reviewedBy).toBe(user.id);
 });
});
