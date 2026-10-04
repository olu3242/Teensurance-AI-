import type {InsuranceAgentId} from './agents';
import type {InsuranceWorkflowId} from './workflows';

export type GapStatus='IMPLEMENTED'|'PARTIAL'|'PLANNED'|'VALIDATION_REQUIRED';
export type GapCapability={
  id:string;
  currentState:string;
  gap:string;
  futureState:string;
  capability:string;
  ownerAgent:InsuranceAgentId;
  trigger:string;
  workflow:InsuranceWorkflowId;
  evidence:string[];
  kpis:string[];
  status:GapStatus;
};

export const insuranceGapRegistry:GapCapability[]=[
  {id:'GAP-01',currentState:'Families research state licensing rules separately.',gap:'Requirements vary by state and are easy to misapply.',futureState:'State-aware journey loads verified applicable requirements.',capability:'Jurisdiction OS',ownerAgent:'GUARD',trigger:'jurisdiction.selected',workflow:'insurance_acquisition',evidence:['verified jurisdiction package','source URL','review date'],kpis:['jurisdiction resolution success','unsupported-state fail-closed rate'],status:'IMPLEMENTED'},
  {id:'GAP-02',currentState:'Permit preparation and insurance preparation are disconnected.',gap:'Families start insurance planning late.',futureState:'Permit, practice, readiness, and insurance form one lifecycle.',capability:'Journey Orchestration',ownerAgent:'COVER',trigger:'readiness.evaluate',workflow:'insurance_acquisition',evidence:['driver stage','guardian household role','advisory readiness signals','underwriting boundary'],kpis:['insurance prep started before licensing','journey completion rate'],status:'IMPLEMENTED'},
  {id:'GAP-03',currentState:'Practice supervision is manually coordinated.',gap:'Parents lack systematic next-best actions.',futureState:'Structured practice, focus areas, attestations, and recommendations.',capability:'RoadReady + Scout',ownerAgent:'T',trigger:'practice.completed',workflow:'insurance_acquisition',evidence:['verified drive','guardian attestation','learning evidence'],kpis:['verified practice sessions','guardian reinforcement rate'],status:'IMPLEMENTED'},
  {id:'GAP-04',currentState:'Practice evidence is fragmented or manual.',gap:'Weak provenance before insurance discussions.',futureState:'Immutable, reviewed Safety & Readiness Passport evidence.',capability:'Passport Evidence Layer',ownerAgent:'GUARD',trigger:'evidence.accepted',workflow:'insurance_acquisition',evidence:['accepted evidence','guardian review','provenance'],kpis:['accepted evidence coverage','evidence rejection rate'],status:'IMPLEMENTED'},
  {id:'GAP-05',currentState:'Families usually contact one insurer first.',gap:'Single-carrier view obscures alternatives.',futureState:'Normalized multi-carrier quote request and comparison.',capability:'Quote Marketplace',ownerAgent:'QUOTE',trigger:'quote.request',workflow:'quote_marketplace',evidence:['normalized request','carrier responses'],kpis:['quotes per session','eligible carrier coverage'],status:'IMPLEMENTED'},
  {id:'GAP-06',currentState:'Quote formats differ by carrier.',gap:'Families cannot compare consistently.',futureState:'Neutral normalized comparison across premium, deductible, coverage, and disclosures.',capability:'Offer Normalization',ownerAgent:'MATCH',trigger:'quote.compare',workflow:'quote_marketplace',evidence:['normalized offers','disclosures','expiry'],kpis:['comparison completion','expired-offer rejection'],status:'IMPLEMENTED'},
  {id:'GAP-07',currentState:'Discount discovery is manual.',gap:'Legitimate carrier discounts may be missed.',futureState:'Carrier-provenance discount and value evidence.',capability:'Savings Evidence',ownerAgent:'SAVE',trigger:'value.realized',workflow:'value_evidence',evidence:['baseline premium','carrier-confirmed premium','carrier discount provenance'],kpis:['projected savings coverage','realized savings coverage'],status:'IMPLEMENTED'},
  {id:'GAP-08',currentState:'Coverage binding happens outside the household journey.',gap:'Status visibility is lost during purchase.',futureState:'Carrier-controlled bind handoff with tracked states.',capability:'Bind Handoff',ownerAgent:'BIND',trigger:'bind.prepare',workflow:'carrier_bind',evidence:['offer selection','disclosure acknowledgement','carrier event'],kpis:['handoff completion','stalled bind rate'],status:'IMPLEMENTED'},
  {id:'GAP-09',currentState:'Families wait for carrier updates.',gap:'Policy state is opaque.',futureState:'Signed carrier events drive lifecycle projection.',capability:'Policy Lifecycle',ownerAgent:'POLICY',trigger:'carrier.event',workflow:'policy_lifecycle',evidence:['signed carrier event','policy identifier','effective date'],kpis:['carrier event processing success','invalid transition rejection'],status:'IMPLEMENTED'},
  {id:'GAP-10',currentState:'Savings claims are mostly estimated.',gap:'Value is hard to prove after purchase.',futureState:'Projected versus realized evidence with no causation claim.',capability:'Value Evidence',ownerAgent:'SAVE',trigger:'value.realized',workflow:'value_evidence',evidence:['guardian baseline','active policy premium'],kpis:['realized evidence rate','negative-value transparency rate'],status:'IMPLEMENTED'},
  {id:'GAP-11',currentState:'Renewals can passively roll over.',gap:'Families may miss re-shopping opportunities.',futureState:'60-day renewal trigger and fresh comparison.',capability:'Renewal Re-shop',ownerAgent:'RENEW',trigger:'renewal.detect',workflow:'renewal_reshop',evidence:['renewal date','fresh quote session','guardian decision'],kpis:['renewal window engagement','reshop completion'],status:'IMPLEMENTED'},
  {id:'GAP-12',currentState:'Operational failures disappear into support queues.',gap:'No controlled recovery or replay.',futureState:'Retry, backoff, dead-letter, correlation, replay through GUARD.',capability:'Runtime Recovery OS',ownerAgent:'GUARD',trigger:'runtime.failure',workflow:'insurance_notifications',evidence:['correlation ID','failure record','dead-letter state'],kpis:['retry recovery rate','dead-letter rate','mean time to recovery'],status:'IMPLEMENTED'},
  {id:'GAP-13',currentState:'Agentic systems are hard to operate safely.',gap:'Admins need health and failure visibility without authority escalation.',futureState:'Admin runtime observability and governed replay.',capability:'Agentic Operations',ownerAgent:'GUARD',trigger:'operations.review',workflow:'insurance_notifications',evidence:['runtime trace','workflow counts','dead-letter queue'],kpis:['unresolved failures','partial-chain rate','agent error rate'],status:'IMPLEMENTED'},
  {id:'GAP-14',currentState:'Validated gaps can become disconnected feature work.',gap:'Roadmap loses measurable linkage to customer problems.',futureState:'Gap-to-capability registry connects problem, agent, workflow, evidence, KPI, and status.',capability:'Capability Governance Registry',ownerAgent:'T',trigger:'roadmap.review',workflow:'insurance_acquisition',evidence:['gap record','implementation status','KPI mapping'],kpis:['implemented-gap coverage','orphan feature count'],status:'IMPLEMENTED'}
];

export function gapRegistrySummary(){
  const total=insuranceGapRegistry.length;
  const implemented=insuranceGapRegistry.filter(item=>item.status==='IMPLEMENTED').length;
  const partial=insuranceGapRegistry.filter(item=>item.status==='PARTIAL').length;
  return {total,implemented,partial,planned:insuranceGapRegistry.filter(item=>item.status==='PLANNED').length,coveragePercent:Math.round((implemented/total)*100)};
}
