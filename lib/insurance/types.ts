import type {RecordBase} from '../platform/db';

export type InsuranceIntent='add_teen'|'compare_current'|'new_policy';
export type CoverageLevel='state_minimum'|'standard'|'higher_limits';

export type QuoteVehicle={
  vin?:string;
  year:number;
  make:string;
  model:string;
  primaryUse:'commute'|'school'|'pleasure'|'mixed';
};

export type CurrentPolicyContext={
  carrierName?:string;
  renewalDate?:string;
  teenAlreadyListed:boolean;
};

export type ReadinessEvidenceSnapshot={
  shared:boolean;
  acceptedMilestoneEvidence:number;
  verifiedPracticeSessions:number;
  generatedAt:string;
  disclaimer:string;
};

export type NormalizedQuoteRequest={
  requestId:string;
  householdId:string;
  guardianId:string;
  teenId:string;
  jurisdiction:string;
  intent:InsuranceIntent;
  coverageLevel:CoverageLevel;
  teen:{
    birthDate:string;
    stage:'pre-permit'|'permit'|'licensed';
  };
  vehicles:QuoteVehicle[];
  currentPolicy?:CurrentPolicyContext;
  readiness?:ReadinessEvidenceSnapshot;
  regulatory:{
    ruleId:string;
    ruleVersion:string;
    sourceUrl:string;
    reviewedAt:string;
  };
  createdAt:string;
};

export type CarrierQuote={
  carrierId:string;
  carrierDisplayName:string;
  quoteId:string;
  monthlyPremiumCents:number;
  sixMonthPremiumCents:number;
  deductibleCents:number;
  coverageLevel:CoverageLevel;
  synthetic:boolean;
  bindable:boolean;
  expiresAt:string;
  disclosures:string[];
};

export type CarrierQuoteResult=
 | {carrierId:string;status:'quoted';quote:CarrierQuote}
 | {carrierId:string;status:'declined';reason:string}
 | {carrierId:string;status:'unavailable';reason:string};

export type QuoteSession=RecordBase&{
  teenId:string;
  idempotencyKey:string;
  fingerprint:string;
  normalizedRequest:NormalizedQuoteRequest;
  results:CarrierQuoteResult[];
  status:'completed'|'no_market';
  createdAt:string;
};

export type QuoteInput={
  householdId:string;
  teenId:string;
  intent:InsuranceIntent;
  coverageLevel:CoverageLevel;
  vehicles:QuoteVehicle[];
  currentPolicy?:CurrentPolicyContext;
  shareReadinessEvidence?:boolean;
};
