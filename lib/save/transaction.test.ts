import {describe,expect,it} from 'vitest';
import {QuoteOrchestrator,ManualQuoteProvider} from './quotes';

describe('SAVE transactional boundaries',()=>{
 it('refuses quote orchestration without parent marketplace consent',async()=>{
  const q=new QuoteOrchestrator([new ManualQuoteProvider([{provider:'A',annualPremium:4000,coverageFingerprint:'same',source:'quote'}])]);
  await expect(q.compare({householdId:'h',coverageFingerprint:'same',drivers:2,vehicles:1,consents:{marketplace:false,telematics:false}})).rejects.toThrow('Marketplace consent');
 });
 it('filters materially different coverage before parent comparison',async()=>{
  const q=new QuoteOrchestrator([new ManualQuoteProvider([
   {provider:'A',annualPremium:4000,coverageFingerprint:'same',source:'quote'},
   {provider:'B',annualPremium:3000,coverageFingerprint:'different',source:'quote'}
  ])]);
  const result=await q.compare({householdId:'h',coverageFingerprint:'same',drivers:2,vehicles:1,consents:{marketplace:true,telematics:false}});
  expect(result.quotes).toHaveLength(1);expect(result.quotes[0].provider).toBe('A');
 });
});
