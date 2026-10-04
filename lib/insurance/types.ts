import type {RecordBase} from '../platform/db';

export type InsuranceImpactBasis={
  id:string;
  version:string;
  jurisdiction:string;
  benchmarkJurisdiction:'US';
  annualIncrementBenchmark:number;
  uncertaintyPct:number;
  stateSpecific:boolean;
  sourceTitle:string;
  sourceUrl:string;
  sourceAsOf:string;
};

export type InsuranceImpactEstimate=RecordBase&{
  teenId:string;
  jurisdiction:string;
  estimateType:'planning_proxy';
  currentAnnualPremium?:number;
  estimatedIncrementLow:number;
  estimatedIncrementHigh:number;
  projectedAnnualPremiumLow?:number;
  projectedAnnualPremiumHigh?:number;
  basis:InsuranceImpactBasis;
  disclaimer:string;
  createdAt:string;
};
