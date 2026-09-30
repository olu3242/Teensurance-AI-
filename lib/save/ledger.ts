import type {PolicyBaseline} from './types';
import type {ComparableQuote} from './service';

export type SavingsVerification=
 | {verified:false;reason:string}
 | {verified:true;previousAnnualPremium:number;newAnnualPremium:number;annualSavings:number;coverageFingerprint:string};

export function calculateVerifiedSavings(baseline:PolicyBaseline|undefined,quote:ComparableQuote|undefined):SavingsVerification{
 if(!baseline||typeof baseline.annualPremium!=='number')return{verified:false,reason:'A premium-bearing policy baseline is required.'};
 if(!baseline.coverageFingerprint)return{verified:false,reason:'The policy baseline needs a coverage fingerprint.'};
 if(!quote)return{verified:false,reason:'A carrier or quote result is required.'};
 if(!['carrier','quote'].includes(quote.source))return{verified:false,reason:'Estimated scenarios cannot become verified savings.'};
 if(quote.coverageFingerprint!==baseline.coverageFingerprint)return{verified:false,reason:'Coverage configurations are not comparable.'};
 return{verified:true,previousAnnualPremium:baseline.annualPremium,newAnnualPremium:quote.annualPremium,annualSavings:Math.max(0,baseline.annualPremium-quote.annualPremium),coverageFingerprint:baseline.coverageFingerprint};
}
