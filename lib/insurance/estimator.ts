import {AppError} from '../platform/auth';
import {normalizeJurisdiction} from '../platform/jurisdictions';
import type {InsuranceImpactBasis} from './types';

const bases:Record<string,InsuranceImpactBasis>={
  TX:{
    id:'insurance-impact-us-family-teen-v1',
    version:'1.0.0',
    jurisdiction:'TX',
    benchmarkJurisdiction:'US',
    annualIncrementBenchmark:3037,
    uncertaintyPct:0.20,
    stateSpecific:false,
    sourceTitle:'Bankrate national teen-driver family policy benchmark',
    sourceUrl:'https://www.bankrate.com/insurance/car/teen-driver-car-insurance/',
    sourceAsOf:'2026-10-03',
  },
};

export function basisForInsuranceImpact(jurisdiction:string){
  const code=normalizeJurisdiction(jurisdiction);
  const basis=bases[code];
  if(!basis)throw new AppError('Insurance impact estimates are not yet available for this state.',409);
  return basis;
}

export function calculateInsuranceImpact(jurisdiction:string,currentAnnualPremium?:number){
  const basis=basisForInsuranceImpact(jurisdiction);
  if(currentAnnualPremium!==undefined&&(!Number.isFinite(currentAnnualPremium)||currentAnnualPremium<0||currentAnnualPremium>100000))
    throw new AppError('Current annual premium must be between $0 and $100,000.',400);
  const margin=basis.annualIncrementBenchmark*basis.uncertaintyPct;
  const estimatedIncrementLow=Math.round(basis.annualIncrementBenchmark-margin);
  const estimatedIncrementHigh=Math.round(basis.annualIncrementBenchmark+margin);
  return {
    basis,
    estimatedIncrementLow,
    estimatedIncrementHigh,
    projectedAnnualPremiumLow:currentAnnualPremium===undefined?undefined:Math.round(currentAnnualPremium+estimatedIncrementLow),
    projectedAnnualPremiumHigh:currentAnnualPremium===undefined?undefined:Math.round(currentAnnualPremium+estimatedIncrementHigh),
  };
}
