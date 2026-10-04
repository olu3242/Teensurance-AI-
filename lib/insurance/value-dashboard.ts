import {all,put} from '../platform/db';
import {AppError} from '../platform/auth';
import type {Member,Profile,User} from '../platform/types';
import type {SavingsEvidence,CostEvidence} from './value';

export type SavingsMilestone={
  id:string;
  kind:'first_projected_savings'|'first_realized_savings'|'annualized_500'|'annualized_1000'|'renewal_savings';
  label:string;
  achievedAt:string;
  evidenceId:string;
  amountCents:number;
};

async function guardian(user:User,householdId:string){
  const member=(await all<Member>('member',householdId)).find(item=>item.ownerId===user.id&&item.active);
  if(!member||member.role!=='guardian')throw new AppError('Guardian insurance access required.',403);
}

function annualize(evidence:SavingsEvidence){return evidence.savingsCents*2}
function monthly(cost:CostEvidence){return cost.period==='monthly'?cost.amountCents:Math.round(cost.amountCents/6)}

export async function insuranceValueDashboard(user:User,householdId:string){
  await guardian(user,householdId);
  const profiles=await all<Profile>('profile',householdId);
  const evidence=(await all<SavingsEvidence>('insurance_savings_evidence',householdId))
    .filter(item=>item.ownerId===user.id)
    .sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  const baselines=(await all<(CostEvidence&{id:string;ownerId:string;teenId:string})>('insurance_cost_baseline',householdId))
    .filter(item=>item.ownerId===user.id);

  const byTeen=profiles.filter(p=>evidence.some(e=>e.teenId===p.ownerId)||baselines.some(b=>b.teenId===p.ownerId)).map(profile=>{
    const teenEvidence=evidence.filter(item=>item.teenId===profile.ownerId);
    const latestProjected=teenEvidence.filter(item=>item.kind==='projected').at(-1);
    const latestRealized=teenEvidence.filter(item=>item.kind==='realized').at(-1);
    const latestBaseline=baselines.filter(item=>item.teenId===profile.ownerId).sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt)).at(-1);
    const carrierDiscounts=latestRealized?.discounts||[];
    return {
      teenId:profile.ownerId,
      teenName:profile.name,
      currentMonthlyCents:latestBaseline?monthly(latestBaseline):undefined,
      projectedMonthlyCents:latestProjected?monthly(latestProjected.replacement):undefined,
      activeMonthlyCents:latestRealized?monthly(latestRealized.replacement):undefined,
      projectedAnnualizedValueCents:latestProjected?annualize(latestProjected):undefined,
      realizedAnnualizedValueCents:latestRealized?annualize(latestRealized):undefined,
      carrierDiscounts,
      history:teenEvidence.map(item=>({kind:item.kind,createdAt:item.createdAt,savingsCents:item.savingsCents,annualizedCents:annualize(item),evidenceId:item.id}))
    };
  });

  const realized=evidence.filter(item=>item.kind==='realized');
  const cumulativeRealizedAnnualizedCents=realized.reduce((sum,item)=>sum+annualize(item),0);
  const milestones=await ensureMilestones(user,householdId,evidence);

  return {
    householdId,
    teens:byTeen,
    cumulativeRealizedAnnualizedCents,
    milestones,
    disclaimer:'Value metrics are evidence comparisons, not guarantees. Projected values come from quotes; realized values require carrier-confirmed active-policy premiums. Teensurance does not claim it caused a premium change.'
  };
}

async function ensureMilestones(user:User,householdId:string,evidence:SavingsEvidence[]):Promise<SavingsMilestone[]>{
  const existing=await all<SavingsMilestone&{householdId:string;ownerId:string}>('insurance_value_milestone',householdId);
  const owned=existing.filter(item=>item.ownerId===user.id);
  const proposals:{kind:SavingsMilestone['kind'];label:string;evidence:SavingsEvidence}[]=[];
  const firstProjected=evidence.find(item=>item.kind==='projected'&&item.savingsCents>0);
  const firstRealized=evidence.find(item=>item.kind==='realized'&&item.savingsCents>0);
  if(firstProjected)proposals.push({kind:'first_projected_savings',label:'First positive projected savings comparison',evidence:firstProjected});
  if(firstRealized)proposals.push({kind:'first_realized_savings',label:'First carrier-confirmed realized savings evidence',evidence:firstRealized});
  const annual500=evidence.find(item=>item.kind==='realized'&&annualize(item)>=50000);
  const annual1000=evidence.find(item=>item.kind==='realized'&&annualize(item)>=100000);
  if(annual500)proposals.push({kind:'annualized_500',label:'Carrier-confirmed annualized value reached $500',evidence:annual500});
  if(annual1000)proposals.push({kind:'annualized_1000',label:'Carrier-confirmed annualized value reached $1,000',evidence:annual1000});
  for(const proposal of proposals){
    if(owned.some(item=>item.kind===proposal.kind))continue;
    const milestone:SavingsMilestone&{householdId:string;ownerId:string}={id:proposal.kind,householdId,ownerId:user.id,kind:proposal.kind,label:proposal.label,achievedAt:proposal.evidence.createdAt,evidenceId:proposal.evidence.id,amountCents:annualize(proposal.evidence)};
    await put('insurance_value_milestone',milestone);
    owned.push(milestone);
  }
  return owned;
}
