import {coverReadiness,nextBestStep,pilotAnalytics,progress,readinessPassport,type State} from '@/lib/domain';
import {workflowRegistry} from './workflows';

export function buildContext(state:State){
 return {
  journey:{nextBestStep:nextBestStep(state),progress:progress(state)},
  passport:readinessPassport(state),
  coverage:coverReadiness(state),
  jurisdiction:state.jurisdiction??{status:'unverified' as const},
  workflows:workflowRegistry.map(w=>({id:w.id,version:w.version,owner:w.owner,complete:w.completion(state),blockers:w.blockers(state)})),
  analytics:pilotAnalytics(state),
  recentEvents:state.events.slice(0,20)
 };
}
