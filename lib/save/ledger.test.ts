import {describe,expect,it} from 'vitest';
import {calculateVerifiedSavings} from './ledger';
import type {PolicyBaseline} from './types';
import type {ComparableQuote} from './service';

const baseline:PolicyBaseline={householdId:'h',annualPremium:5000,coverageFingerprint:'100-300-100|1000',drivers:3,vehicles:2,currentDiscounts:[],source:'document',capturedAt:'2026-09-29T00:00:00Z'};
const quote=(overrides:Partial<ComparableQuote>={}):ComparableQuote=>({id:'q',householdId:'h',ownerId:'p',provider:'carrier',annualPremium:4200,coverageFingerprint:'100-300-100|1000',source:'quote',capturedAt:'2026-09-29T00:00:00Z',...overrides});

describe('verified savings ledger',()=>{
 it('verifies equivalent coverage using premium evidence',()=>{
   expect(calculateVerifiedSavings(baseline,quote())).toEqual({verified:true,previousAnnualPremium:5000,newAnnualPremium:4200,annualSavings:800,coverageFingerprint:'100-300-100|1000'});
 });
 it('rejects materially different coverage',()=>{
   const result=calculateVerifiedSavings(baseline,quote({coverageFingerprint:'50-100-50|2000'}));
   expect(result.verified).toBe(false);
 });
 it('does not count a higher premium as negative savings',()=>{
   const result=calculateVerifiedSavings(baseline,quote({annualPremium:5500}));
   expect(result.verified&&result.annualSavings).toBe(0);
 });
 it('rejects missing baseline premium',()=>{
   expect(calculateVerifiedSavings({...baseline,annualPremium:undefined},quote()).verified).toBe(false);
 });
});
