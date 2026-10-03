import type {Rule} from './types';

export type PracticeTotals={verifiedMinutes:number;nightMinutes:number;weatherMinutes:number};

export type PracticeProjection={
 jurisdiction:string;
 authorityLabel:string;
 sourceUrl:string;
 required:PracticeTotals;
 verified:PracticeTotals;
 remaining:PracticeTotals;
 complete:boolean;
 nextAction?:{category:'total'|'night'|'poor_weather';minutes:number;message:string};
 claim:string;
};

const remaining=(required:number,actual:number)=>Math.max(0,required-actual);

export function projectPractice(rule:Rule|undefined,totals:PracticeTotals):PracticeProjection|undefined{
 if(!rule)return undefined;
 const required={verifiedMinutes:rule.totalMinutes,nightMinutes:rule.nightMinutes,weatherMinutes:rule.weatherMinutes||0};
 const gaps={
  verifiedMinutes:remaining(required.verifiedMinutes,totals.verifiedMinutes),
  nightMinutes:remaining(required.nightMinutes,totals.nightMinutes),
  weatherMinutes:remaining(required.weatherMinutes,totals.weatherMinutes),
 };
 const nextAction=gaps.verifiedMinutes>0
  ?{category:'total' as const,minutes:gaps.verifiedMinutes,message:`Complete ${gaps.verifiedMinutes} more verified supervised-practice minutes.`}
  :gaps.nightMinutes>0
   ?{category:'night' as const,minutes:gaps.nightMinutes,message:`Complete ${gaps.nightMinutes} more verified night-practice minutes.`}
   :gaps.weatherMinutes>0
    ?{category:'poor_weather' as const,minutes:gaps.weatherMinutes,message:`Complete ${gaps.weatherMinutes} more verified poor-weather practice minutes.`}
    :undefined;
 return {
  jurisdiction:rule.jurisdiction,
  authorityLabel:rule.authorityLabel||rule.jurisdiction,
  sourceUrl:rule.sourceUrl,
  required,
  verified:totals,
  remaining:gaps,
  complete:!nextAction,
  nextAction,
  claim:'Supervisor-attested practice evidence only; this projection does not establish legal eligibility or state acceptance.'
 };
}

export function projectEvidenceCarryover(from:Rule|undefined,to:Rule|undefined,totals:PracticeTotals){
 return {
  fromJurisdiction:from?.jurisdiction,
  toJurisdiction:to?.jurisdiction,
  preserved:totals,
  destination:projectPractice(to,totals),
  claim:'Existing verified evidence is preserved for review. This is not a determination that another jurisdiction will accept or credit those hours.'
 };
}
