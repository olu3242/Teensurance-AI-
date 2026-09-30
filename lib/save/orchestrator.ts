import type {DomainEvent} from '@/lib/os/types';
import {getNextBestSavingsAction} from './agent';
import {isSaveTriggerEvent} from './events';
import type {SavingsDecision,SavingsFacts,SavingsOpportunity} from './types';

export type SaveOrchestrationResult={
  handled:boolean;
  event?:string;
  opportunities:SavingsOpportunity[];
  decision?:SavingsDecision;
  guard:{
    decision:'ALLOW'|'DEFER'|'REQUIRE_PARENT'|'REQUIRE_CONSENT'|'DENY';
    reason:string;
  };
};

export function orchestrateSavingsEvent(input:{
  event:DomainEvent;
  facts:SavingsFacts;
  role:'teen'|'parent';
  drivingState:'parked'|'driving';
  guardianConsent:boolean;
}):SaveOrchestrationResult{
  if(!isSaveTriggerEvent(input.event)){
    return {handled:false,opportunities:[],guard:{decision:'DENY',reason:'Event is not registered as a SAVE trigger.'}};
  }
  if(input.drivingState==='driving'){
    return {handled:true,event:input.event.type,opportunities:[],guard:{decision:'DEFER',reason:'SAVE does not surface nonessential insurance actions while driving.'}};
  }
  if(input.role!=='parent'){
    return {handled:true,event:input.event.type,opportunities:[],guard:{decision:'REQUIRE_PARENT',reason:'Insurance savings actions are parent or guardian controlled.'}};
  }

  const result=getNextBestSavingsAction(input.facts);
  if(result.decision.requiresConsent&&!input.guardianConsent){
    return {
      handled:true,
      event:input.event.type,
      opportunities:result.opportunities,
      decision:result.decision,
      guard:{decision:'REQUIRE_CONSENT',reason:'Guardian consent is required before sharing household data or requesting insurance comparisons.'}
    };
  }

  return {
    handled:true,
    event:input.event.type,
    opportunities:result.opportunities,
    decision:result.decision,
    guard:{decision:'ALLOW',reason:'SAVE may present the next evidence-backed savings action. Material insurance changes remain parent controlled.'}
  };
}
