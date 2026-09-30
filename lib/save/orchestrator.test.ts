import {describe,expect,it} from 'vitest';
import {orchestrateSavingsEvent} from './orchestrator';
import {saveEvent} from './events';
import type {SavingsFacts} from './types';

const facts: SavingsFacts={
  householdId:'hh-1',
  now:'2026-09-29T12:00:00.000Z',
  driverEducationVerified:true,
  goodStudentEvidenceVerified:false,
  collegeAwayFromHome:false,
  vehicleAssignmentKnown:false,
  householdVehicleCount:1,
  homePolicyKnown:false,
  policy:{
    householdId:'hh-1',
    drivers:3,
    vehicles:1,
    currentDiscounts:[],
    source:'document',
    capturedAt:'2026-09-29T10:00:00.000Z',
    renewalDate:'2026-10-20'
  }
};

describe('SAVE event orchestration',()=>{
  it('defers all SAVE interactions while driving',()=>{
    const result=orchestrateSavingsEvent({event:saveEvent('policy.renewal_30_days'),facts,role:'parent',drivingState:'driving',guardianConsent:true});
    expect(result.guard.decision).toBe('DEFER');
  });

  it('requires a parent for insurance savings actions',()=>{
    const result=orchestrateSavingsEvent({event:saveEvent('driver_education.completed'),facts,role:'teen',drivingState:'parked',guardianConsent:true});
    expect(result.guard.decision).toBe('REQUIRE_PARENT');
  });

  it('requires consent before marketplace-oriented action',()=>{
    const result=orchestrateSavingsEvent({event:saveEvent('policy.renewal_30_days'),facts,role:'parent',drivingState:'parked',guardianConsent:false});
    expect(result.guard.decision).toBe('REQUIRE_CONSENT');
    expect(result.decision?.requiresConsent).toBe(true);
  });

  it('allows presentation of the next savings action after guard checks',()=>{
    const result=orchestrateSavingsEvent({event:saveEvent('policy.renewal_30_days'),facts,role:'parent',drivingState:'parked',guardianConsent:true});
    expect(result.guard.decision).toBe('ALLOW');
    expect(result.decision?.action).toBe('review_renewal');
  });

  it('ignores unrelated domain events',()=>{
    const result=orchestrateSavingsEvent({event:{type:'drive.logged'},facts,role:'parent',drivingState:'parked',guardianConsent:true});
    expect(result.handled).toBe(false);
  });
});
