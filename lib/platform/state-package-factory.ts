import type {Rule} from './types';
import {normalizeJurisdiction} from './jurisdictions';
import {supportedJurisdiction} from './state-experience';

export type StatePackageDraft={
 jurisdiction:string;
 stateName:string;
 authorityLabel:string;
 sourceTitle:string;
 sourceUrl:string;
 effectiveFrom:string;
 validUntil:string;
 reviewedAt:string;
 version:string;
 legalRequirements:Rule['legalRequirements'];
 learnerMinimumAge?:number;
 minimumAge:number;
 holdingMonths:number;
 totalMinutes:number;
 nightMinutes:number;
 weatherMinutes?:number;
 requiredEvidence:string[];
};

export type StatePackageValidation={valid:boolean;errors:string[]};

export function validateStatePackageDraft(draft:StatePackageDraft):StatePackageValidation{
 const errors:string[]=[];
 const jurisdiction=normalizeJurisdiction(draft.jurisdiction);
 const state=supportedJurisdiction(jurisdiction);
 if(!state)errors.push('Jurisdiction must be one of the 50 supported U.S. states.');
 if(state&&state.name!==draft.stateName)errors.push('State name must match the jurisdiction catalog.');
 if(!draft.authorityLabel.trim())errors.push('Official licensing authority is required.');
 try{const url=new URL(draft.sourceUrl);if(url.protocol!=='https:')errors.push('Official source URL must use HTTPS.')}catch{errors.push('Official source URL must be valid.')}
 if(!draft.sourceTitle.trim())errors.push('Official source title is required.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.effectiveFrom))errors.push('Effective date must use YYYY-MM-DD.');
 if(!Number.isFinite(Date.parse(draft.validUntil)))errors.push('Review expiry must be a valid timestamp.');
 if(!Number.isFinite(Date.parse(draft.reviewedAt)))errors.push('Reviewed-at must be a valid timestamp.');
 if(Date.parse(draft.validUntil)<=Date.parse(draft.reviewedAt))errors.push('Review expiry must follow source review.');
 if(!draft.version.trim())errors.push('Version is required.');
 if(!draft.legalRequirements.length)errors.push('At least one source-backed legal requirement is required.');
 if(draft.minimumAge<0||draft.minimumAge>25)errors.push('Minimum licensing age is outside the supported teen-driver range.');
 if(draft.holdingMonths<0||draft.holdingMonths>60)errors.push('Holding period is outside the supported range.');
 for(const [name,value] of [['totalMinutes',draft.totalMinutes],['nightMinutes',draft.nightMinutes],['weatherMinutes',draft.weatherMinutes||0]] as const){
  if(!Number.isInteger(value)||value<0)errors.push(`${name} must be a non-negative whole number.`);
 }
 if(draft.nightMinutes>draft.totalMinutes)errors.push('Night practice cannot exceed total practice.');
 if((draft.weatherMinutes||0)>draft.totalMinutes)errors.push('Poor-weather practice cannot exceed total practice.');
 return {valid:errors.length===0,errors};
}

export function buildStateRuleDraft(draft:StatePackageDraft):Rule{
 const validation=validateStatePackageDraft(draft);
 if(!validation.valid)throw new Error(validation.errors.join(' '));
 const jurisdiction=normalizeJurisdiction(draft.jurisdiction);
 return {
  id:`${jurisdiction.toLowerCase()}-draft-${draft.version}`,
  householdId:'public',
  ownerId:'content',
  jurisdiction,
  stateName:draft.stateName,
  legalRequirements:draft.legalRequirements,
  aliases:[`US-${jurisdiction}`],
  version:draft.version,
  sourceUrl:draft.sourceUrl,
  sourceTitle:draft.sourceTitle,
  reviewedAt:draft.reviewedAt,
  validUntil:draft.validUntil,
  effectiveFrom:draft.effectiveFrom,
  learnerMinimumAge:draft.learnerMinimumAge,
  minimumAge:draft.minimumAge,
  holdingMonths:draft.holdingMonths,
  totalMinutes:draft.totalMinutes,
  nightMinutes:draft.nightMinutes,
  weatherMinutes:draft.weatherMinutes,
  requiredEvidence:draft.requiredEvidence,
  authorityLabel:draft.authorityLabel,
  status:'verified',
  lifecycleStatus:'draft',
  reviewedBy:'Pending human legal-source review'
 };
}
