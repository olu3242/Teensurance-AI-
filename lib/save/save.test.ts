import {describe,expect,it} from 'vitest';
import {detectSavingsOpportunities,getNextBestSavingsAction,type SavingsFacts} from './index';

const base=(overrides:Partial<SavingsFacts>={}):SavingsFacts=>({
  householdId:'hh-1',
  now:'2026-09-29T12:00:00.000Z',
  driverEducationVerified:false,
  goodStudentEvidenceVerified:false,
  collegeAwayFromHome:false,
  vehicleAssignmentKnown:false,
  householdVehicleCount:1,
  homePolicyKnown:false,
  ...overrides
});

describe('SAVE foundation',()=>{
  it('requires a policy baseline before claiming measurable savings',()=>{
    const result=getNextBestSavingsAction(base());
    expect(result.decision.action).toBe('collect_policy_baseline');
    expect(result.opportunities[0].category).toBe('reshop');
    expect(result.opportunities[0].estimatedSavings).toBeUndefined();
  });

  it('detects verified evidence without inventing a discount amount',()=>{
    const opportunities=detectSavingsOpportunities(base({
      driverEducationVerified:true,
      policy:{
        householdId:'hh-1',drivers:3,vehicles:2,currentDiscounts:[],
        source:'document',capturedAt:'2026-09-29T10:00:00.000Z'
      }
    }));
    const item=opportunities.find(x=>x.category==='driver_education');
    expect(item?.status).toBe('comparison_ready');
    expect(item?.estimatedSavings).toBeUndefined();
  });

  it('prioritizes a renewal comparison window when a baseline exists',()=>{
    const result=getNextBestSavingsAction(base({
      policy:{
        householdId:'hh-1',drivers:3,vehicles:1,currentDiscounts:[],
        source:'document',capturedAt:'2026-09-29T10:00:00.000Z',
        renewalDate:'2026-10-20'
      }
    }));
    expect(result.decision.action).toBe('review_renewal');
    expect(result.decision.requiresParent).toBe(true);
    expect(result.decision.requiresConsent).toBe(true);
  });

  it('never labels an opportunity verified from household facts alone',()=>{
    const opportunities=detectSavingsOpportunities(base({
      annualMileage:5000,
      telematicsOptIn:true,
      householdVehicleCount:2,
      vehicleAssignmentKnown:true,
      homePolicyKnown:true,
      policy:{
        householdId:'hh-1',drivers:3,vehicles:2,currentDiscounts:[],
        source:'manual',capturedAt:'2026-09-29T10:00:00.000Z'
      }
    }));
    expect(opportunities.every(x=>x.status!=='verified')).toBe(true);
  });
});
