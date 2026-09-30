import type {PolicyBaseline} from './types';

export type ScenarioInput={
 baseline:PolicyBaseline;
 proposed:{
  annualPremium?:number;
  deductible?:number;
  annualMileage?:number;
  vehicleAssignment?:string;
  telematics?:boolean;
  coverageFingerprint?:string;
 };
 source:'carrier'|'quote'|'estimate';
};
export type ScenarioResult={
 comparable:boolean;
 projectedAnnualPremium?:number;
 projectedDifference?:number;
 direction:'lower'|'higher'|'same'|'unknown';
 verified:false;
 warnings:string[];
};

export function runSavingsScenario(input:ScenarioInput):ScenarioResult{
 const warnings:string[]=[];
 const current=input.baseline.annualPremium;
 const proposedCoverage=input.proposed.coverageFingerprint||input.baseline.coverageFingerprint;
 const comparable=Boolean(input.baseline.coverageFingerprint&&proposedCoverage===input.baseline.coverageFingerprint);
 if(!comparable)warnings.push('Coverage is not confirmed comparable; this scenario cannot support a savings claim.');
 if(input.source==='estimate')warnings.push('This is an estimate, not a carrier quote or verified savings result.');
 if(input.proposed.deductible!==undefined&&input.baseline.deductible!==undefined&&input.proposed.deductible!==input.baseline.deductible)warnings.push('Changing the deductible changes the coverage configuration and should be reviewed separately.');
 const projected=input.proposed.annualPremium;
 const diff=current!==undefined&&projected!==undefined?current-projected:undefined;
 return {
  comparable,
  projectedAnnualPremium:projected,
  projectedDifference:diff,
  direction:diff===undefined?'unknown':diff>0?'lower':diff<0?'higher':'same',
  verified:false,
  warnings
 };
}
