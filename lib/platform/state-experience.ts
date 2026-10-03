import type {Profile,Rule} from './types';
import type {PracticeProjection} from './practice';

export type StateExperience={
 jurisdiction:string;
 stateName:string;
 authority:string;
 sourceTitle:string;
 sourceUrl:string;
 version:string;
 reviewedAt:string;
 validUntil:string;
 stage:Profile['stage'];
 legalRequirements:{id:string;kind:string;label:string}[];
 practice?:PracticeProjection;
 boundary:string;
};

export function resolveStateExperience(profile:Profile,rule:Rule|undefined,practice?:PracticeProjection):StateExperience|undefined{
 if(!rule)return undefined;
 const requirements=(rule.legalRequirements||[])
  .filter(item=>!item.stages?.length||item.stages.includes(profile.stage))
  .map(({id,kind,label})=>({id,kind,label}));
 return {
  jurisdiction:rule.jurisdiction,
  stateName:rule.stateName||rule.jurisdiction,
  authority:rule.authorityLabel||rule.jurisdiction,
  sourceTitle:rule.sourceTitle,
  sourceUrl:rule.sourceUrl,
  version:rule.version,
  reviewedAt:rule.reviewedAt,
  validUntil:rule.validUntil,
  stage:profile.stage,
  legalRequirements:requirements,
  practice,
  boundary:'Teensurance displays a reviewed state-law snapshot for planning. The licensing authority determines legal eligibility, and laws can change.'
 };
}

export type SupportedJurisdiction={
 code:string;
 name:string;
 rulePackage:'reviewed'|'pending';
};

const stateCatalog:[string,string][]=[
 ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
 ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
 ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
 ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
 ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
 ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
 ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
 ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
 ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
 ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
];

const reviewedRulePackages=new Set(['TX','PA']);

export const supportedJurisdictions:SupportedJurisdiction[]=stateCatalog.map(([code,name])=>({
 code,
 name,
 rulePackage:reviewedRulePackages.has(code)?'reviewed':'pending'
}));

export function supportedJurisdiction(value:string){
 const code=value.trim().toUpperCase().replace(/^US-/,'');
 return supportedJurisdictions.find(item=>item.code===code);
}
