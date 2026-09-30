import {describe,expect,it} from 'vitest';
import {runSavingsScenario} from './scenario';
import {saveRoleMessage} from './authorization';

describe('parent SAVE workspace boundaries',()=>{
 it('keeps scenario results unverified',()=>expect(runSavingsScenario({baseline:{householdId:'h',annualPremium:5000,coverageFingerprint:'x',drivers:3,vehicles:2,currentDiscounts:[],source:'document',capturedAt:'2026-09-01'},proposed:{annualPremium:4200,coverageFingerprint:'x'},source:'estimate'}).verified).toBe(false));
 it('states parent ownership for teen-facing insurance actions',()=>expect(saveRoleMessage('teen')).toContain('parent or guardian'));
});
