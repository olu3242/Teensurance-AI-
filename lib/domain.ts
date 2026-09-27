export type Role = 'teen' | 'parent';
export type DrivingState = 'parked' | 'driving';
export type Log = { id:string; date:string; minutes:number; night:boolean; skill:string; supervisor:string; note:string; status:'pending'|'verified'; createdAt:string; verifiedAt?:string };
export type Audit = { id:string; at:string; action:string; actor:Role; drivingState:DrivingState; decision:Decision; reason:string };
export type Decision = 'ALLOW'|'DEFER'|'REQUIRE_PARENT'|'REQUIRE_VERIFICATION'|'REQUIRE_OFFICIAL_SOURCE'|'DENY';
export type State = { logs:Log[]; audit:Audit[]; goalHours:number };
export const initialState = ():State => ({logs:[],audit:[],goalHours:20});
export const steps = [
  {id:'prepare',name:'Prepare for the permit',agent:'READY',detail:'Confirm your local licensing rules with the official motor vehicle agency. Make a study plan with your parent or guardian.',proof:'Record the official source and completed permit requirements.'},
  {id:'learn',name:'Learn the essentials',agent:'ACE',detail:'Review road signs, right of way, distraction risks, and insurance basics before practice.',proof:'Complete a knowledge check with your parent or instructor.'},
  {id:'practice',name:'Practice with a supervisor',agent:'MILES',detail:'Plan a parked-car practice session, then record time and skills afterward. A parent reviews each entry.',proof:'A supervisor confirms each session.'},
  {id:'license',name:'Check license readiness',agent:'GO',detail:'Check the current rules in your jurisdiction and schedule any required test through the official agency.',proof:'Official eligibility and test results.'},
  {id:'coverage',name:'Prepare for coverage',agent:'COVER',detail:'A parent or guardian reviews driver and vehicle coverage with a licensed professional before independent driving.',proof:'Parent confirms the coverage decision.'}
] as const;
export function guard(action:string, role:Role, drivingState:DrivingState, state:State, payload:Record<string,unknown>):{decision:Decision;reason:string} {
  if (drivingState === 'driving') return {decision:'DEFER',reason:'Put the phone away while driving. Resume when parked.'};
  if (action === 'log') {
    if (role !== 'teen') return {decision:'DENY',reason:'Only the teen creates a practice entry in this pilot.'};
    if (!payload.supervisor) return {decision:'REQUIRE_VERIFICATION',reason:'A supervisor name is required for a supervised entry.'};
    return {decision:'ALLOW',reason:'The entry will await parent review.'};
  }
  if (action === 'verify') {
    if (role !== 'parent') return {decision:'REQUIRE_PARENT',reason:'A parent must review practice entries.'};
    if (!state.logs.some(l=>l.id===payload.id && l.status==='pending')) return {decision:'DENY',reason:'No pending entry matches this request.'};
    return {decision:'ALLOW',reason:'Parent review recorded.'};
  }
  if (action === 'goal') return role === 'parent' ? {decision:'ALLOW',reason:'Family practice goal updated.'} : {decision:'REQUIRE_PARENT',reason:'A parent sets the family practice goal.'};
  return {decision:'DENY',reason:'Unknown action.'};
}
export function progress(state:State) {
  const verified = state.logs.filter(l=>l.status==='verified');
  const minutes = verified.reduce((sum,l)=>sum+l.minutes,0);
  const nightMinutes = verified.filter(l=>l.night).reduce((sum,l)=>sum+l.minutes,0);
  return {verifiedMinutes:minutes,nightMinutes,pending:state.logs.length-verified.length,percent:Math.min(100,Math.round(minutes/(state.goalHours*60)*100))};
}
