import {all,put} from './db';
import type {LegalSourceCandidate} from './legal-source-queue';
import type {PromotedLegalRule} from './legal-rule-promotion';
import {assessPromotedRule,type LegalRecertificationImpact} from './legal-change-recertification';
import {upsertLegalEscalations} from './legal-escalation';

export type ScheduledRecertificationResult={scanned:number;open:number;resolved:number;ranAt:string};

export async function runScheduledLegalRecertification(now=new Date()):Promise<ScheduledRecertificationResult>{
 const [promoted,sources,existing]=await Promise.all([
  all<PromotedLegalRule>('promoted_legal_rule'),
  all<LegalSourceCandidate>('legal_source_candidate'),
  all<LegalRecertificationImpact>('legal_recertification_impact')
 ]);
 let open=0,resolved=0;const changed:LegalRecertificationImpact[]=[];
 for(const item of promoted){
  const reasons=assessPromotedRule(item,sources,now);
  const old=existing.find(x=>x.ruleId===item.rule.id&&x.status==='open');
  if(reasons.length){
   open++;
   const impact:LegalRecertificationImpact={id:old?.id||crypto.randomUUID(),householdId:'',ownerId:'system:legal-recertification',jurisdiction:item.jurisdiction,ruleId:item.rule.id,version:item.version,status:'open',reasons,sourceIds:item.sourceIds,affected:['state_experience','journey','passport','scout','roadready'],detectedAt:old?.detectedAt||now.toISOString(),note:'Scheduled legal recertification detected a source or rule validity change. User-facing legal guidance remains fail-closed pending human review.'};
   await put('legal_recertification_impact',impact);changed.push(impact);
  }else if(old){
   resolved++;
   const resolvedImpact={...old,status:'resolved' as const,resolvedAt:now.toISOString(),note:'Automated validity checks are clear. Human legal-rule lifecycle approval remains required before publication.'};await put('legal_recertification_impact',resolvedImpact);changed.push(resolvedImpact);
  }
 }
 await upsertLegalEscalations(changed,now);
 await put('legal_recertification_run',{id:crypto.randomUUID(),householdId:'',ownerId:'system:legal-recertification',scanned:promoted.length,open,resolved,ranAt:now.toISOString()});
 return {scanned:promoted.length,open,resolved,ranAt:now.toISOString()};
}
