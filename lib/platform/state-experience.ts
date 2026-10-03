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

export const supportedJurisdictions=[
 {code:'TX',name:'Texas'},
 {code:'PA',name:'Pennsylvania'},
] as const;
