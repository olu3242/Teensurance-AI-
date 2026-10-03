import type {State} from '@/lib/domain';

export function operationalInbox(state:State){
 return{
  openReviews:state.reviewQueue.filter(x=>x.status==='open'),
  openExceptions:state.exceptions.filter(x=>x.status==='open'),
  pendingRequirementSources:state.requirementSources.filter(x=>x.status==='pending_review'),
  deferredNotifications:state.notifications.filter(x=>x.status==='deferred'),
  workflowInstances:state.workflowInstances
 };
}

export function verifiedRequirementSources(state:State){
 return state.requirementSources.filter(x=>x.status==='verified');
}
