import {afterEach,beforeEach,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {register} from '@/lib/platform/auth';import {closeDatabases} from '@/lib/platform/db';
import {joinWaitlist,listWaitlist,updateWaitlist} from './service';
let dir:string;
beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'waitlist-test-'));process.env.TEENSURANCE_DB_PATH=join(dir,'db.sqlite')});
afterEach(async()=>{await closeDatabases();delete process.env.TEENSURANCE_DB_PATH;delete process.env.TEENSURANCE_ADMIN_USER_IDS;rmSync(dir,{recursive:true,force:true})});
it('captures a duplicate-safe waitlist signup and supports governed admin transitions',async()=>{const input={email:'Parent@Example.com',parentName:'Parent Example',teenCount:2,region:'TX',referralSource:'friend',consent:true as const,website:''};expect(await joinWaitlist(input)).toEqual({ok:true,status:'received'});expect(await joinWaitlist(input)).toEqual({ok:true,status:'received'});const admin=await register('admin@example.test','long-password-123','Admin');process.env.TEENSURANCE_ADMIN_USER_IDS=admin.id;const entries=await listWaitlist(admin);expect(entries).toHaveLength(1);expect(entries[0].email).toBe('parent@example.com');expect(entries[0].status).toBe('NEW');const contacted=await updateWaitlist(admin,{id:entries[0].id,status:'CONTACTED',notes:'Reached guardian.'});expect(contacted.status).toBe('CONTACTED');await expect(updateWaitlist(admin,{id:entries[0].id,status:'ENROLLED',notes:'Skip invite'})).rejects.toThrow('Invalid waitlist status transition');const invited=await updateWaitlist(admin,{id:entries[0].id,status:'INVITED',notes:'Pilot invite issued.'});expect(invited.status).toBe('INVITED');const enrolled=await updateWaitlist(admin,{id:entries[0].id,status:'ENROLLED',notes:'Activated in pilot.'});expect(enrolled.status).toBe('ENROLLED')});
it('requires consent and administrator access',async()=>{await expect(joinWaitlist({email:'p@example.com',parentName:'P Example',teenCount:1,region:'TX',consent:false})).rejects.toThrow('check the waitlist form');const user=await register('user@example.test','long-password-123','User');await expect(listWaitlist(user)).rejects.toThrow('Administrator')});


it('keeps enrollment successful when confirmation email queue is unavailable',async()=>{
 const input={email:'notify@example.com',parentName:'Notify Parent',teenCount:1,region:'TX',referralSource:'',consent:true as const,website:''};
 const result=await joinWaitlist(input);
 expect(result).toEqual({ok:true,status:'received'});
});
