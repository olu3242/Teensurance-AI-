import type {Rule} from './types';
import {texasRule} from './texas';
import {pennsylvaniaRule} from './pennsylvania';

export const jurisdictionRules:Rule[]=[texasRule,pennsylvaniaRule];

export function normalizeJurisdiction(value:string){
 const code=value.trim().toUpperCase();
 return code.startsWith('US-')?code.slice(3):code;
}

export function ruleForJurisdiction(value:string,rules=jurisdictionRules,now=new Date()){
 const code=normalizeJurisdiction(value);
 return rules
  .filter(rule=>(rule.jurisdiction===code||(rule.aliases||[]).includes(value.toUpperCase()))&&rule.status==='verified'&&rule.effectiveFrom<=now.toISOString().slice(0,10)&&rule.validUntil>now.toISOString())
  .sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt))[0];
}
