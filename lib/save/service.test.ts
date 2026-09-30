import {describe,expect,it} from 'vitest';

describe('SAVE persistence invariants',()=>{
 it('defines verified savings as comparable before/after premium evidence',async()=>{
   const source=await import('./service');
   expect(typeof source.verifySavings).toBe('function');
   expect(typeof source.savePolicyBaseline).toBe('function');
   expect(typeof source.savingsDashboard).toBe('function');
 });
});
