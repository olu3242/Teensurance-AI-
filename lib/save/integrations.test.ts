import {describe,expect,it} from 'vitest';
import {reviewFirstPolicyExtractor} from './policy-document';
import {ManualQuoteProvider,QuoteOrchestrator} from './quotes';
import {buildSavingsPassport} from './passport';

describe('SAVE integration layer',()=>{
 it('extracts policy facts but requires human review',async()=>{
  const result=await reviewFirstPolicyExtractor.extract({mimeType:'text/plain',text:'Carrier: Example Mutual\nAnnual Premium: $5,200\nRenewal Date: 10/20/2026\nDrivers: 3\nVehicles: 2\nDeductible: $1,000'});
  expect(result.annualPremium.value).toBe(5200);expect(result.requiresHumanReview).toBe(true);expect(result.coverageFingerprint.value).toBeUndefined();
 });
 it('filters non-comparable quotes',async()=>{
  const orchestrator=new QuoteOrchestrator([new ManualQuoteProvider([
   {provider:'A',annualPremium:4300,coverageFingerprint:'same',source:'quote'},
   {provider:'B',annualPremium:3900,coverageFingerprint:'different',source:'quote'}
  ])]);
  const result=await orchestrator.compare({householdId:'h',coverageFingerprint:'same',drivers:3,vehicles:2,consents:{marketplace:true,telematics:false}});
  expect(result.quotes).toHaveLength(1);expect(result.quotes[0].provider).toBe('A');
 });
 it('builds a readiness passport without a risk score',()=>{
  const result=buildSavingsPassport({evidence:[],vehicles:[],opportunities:[]});
  expect(result.percent).toBe(0);expect(result.disclaimer).toContain('not an underwriting score');
 });
});
