import {describe,it,expect} from 'vitest';
import {coverStatus,engagementPolicy,guard,initialState,nextBestStep,normalizeState,pilotAnalytics,progress,readinessPassport,type State} from './domain';

describe('GUARD and supervised progress',()=>{
 it('defers every action while driving',()=>{
   for(const action of ['plan','safety','log','reflect','verify','goal']) expect(guard(action,'parent','driving',initialState(),{}).decision).toBe('DEFER');
 });
 it('requires a parent to verify and leaves pending time out of progress',()=>{
  const state=initialState();state.logs.push({id:'entry',date:'2026-09-01',minutes:60,night:true,skill:'Turns',supervisor:'Adult',note:'',status:'pending',createdAt:'2026-09-01T12:00:00Z'});
  expect(guard('verify','teen','parked',state,{id:'entry'}).decision).toBe('REQUIRE_PARENT');
  expect(progress(state).verifiedMinutes).toBe(0);
  expect(guard('verify','parent','parked',state,{id:'entry'}).decision).toBe('REQUIRE_CONSENT');
  state.consent.guardianAcknowledged=true;
  expect(guard('verify','parent','parked',state,{id:'entry'}).decision).toBe('ALLOW');
  state.logs[0].status='verified';expect(progress(state)).toMatchObject({verifiedMinutes:60,nightMinutes:60,pending:0,percent:5});
 });
 it('separates teen and guardian safety attestations',()=>{
   const state=initialState();
   state.consent.teenAcknowledged=true;
   expect(guard('safety','parent','parked',state,{topic:'phone_away'}).decision).toBe('DENY');
   expect(guard('safety','teen','parked',state,{topic:'supervisor_ready'}).decision).toBe('REQUIRE_PARENT');
   expect(guard('safety','teen','parked',state,{topic:'phone_away'}).decision).toBe('ALLOW');
   expect(guard('safety','parent','parked',state,{topic:'supervisor_ready'}).decision).toBe('ALLOW');
 });
 it('requires a complete parked practice plan',()=>{
  const state=initialState();
  state.consent.teenAcknowledged=true;

  expect(
    guard('plan','teen','parked',state,{skill:'Parking'}).decision
  ).toBe('REQUIRE_VERIFICATION');

  expect(
    guard('plan','teen','parked',state,{
      skill:'Parking',
      objective:'Practice reference points',
      supervisor:'Adult'
    }).decision
  ).toBe('ALLOW');
});
});

describe('Safety & Readiness Passport',()=>{
 it('starts with evidence states, not a risk or legal eligibility score',()=>{
   const passport=readinessPassport(initialState());
   expect(passport.legalEligibility).toBe(false);
   expect(passport.evidencePresent).toBe(0);
   expect(passport.dimensions.every(item=>item.status==='not_started')).toBe(true);
   expect(passport.disclaimer).toContain('not a licensing decision');
 });
 it('recognizes verified practice, safe setup, reflection, and guardian participation',()=>{
   const state=initialState();
   state.logs.push({id:'drive-1',date:'2026-09-01',minutes:45,night:false,skill:'Turns',supervisor:'Adult',note:'',status:'verified',createdAt:'2026-09-01T12:00:00Z',verifiedAt:'2026-09-01T13:00:00Z'});
   state.safetyChecks.push(
    {topic:'phone_away',completedBy:'teen',completedAt:'2026-09-01T11:00:00Z'},
    {topic:'seatbelt_setup',completedBy:'teen',completedAt:'2026-09-01T11:00:00Z'},
    {topic:'mirrors_controls',completedBy:'teen',completedAt:'2026-09-01T11:00:00Z'},
    {topic:'supervisor_ready',completedBy:'parent',completedAt:'2026-09-01T11:00:00Z'},
    {topic:'emergency_plan',completedBy:'parent',completedAt:'2026-09-01T11:00:00Z'}
   );
   state.reflections.push({logId:'drive-1',confidence:'steady',challenge:'Busy intersection',nextFocus:'Gap selection',createdAt:'2026-09-01T14:00:00Z'});
   expect(readinessPassport(state).evidencePresent).toBe(4);
 });
 it('migrates the original pilot state without losing logs',()=>{
   const old={logs:[{id:'x'}],audit:[],goalHours:20} as unknown as Partial<State>;
   const migrated=normalizeState(old);
   expect(migrated.logs).toHaveLength(1);
   expect(migrated.safetyChecks).toEqual([]);
   expect(migrated.reflections).toEqual([]);
 });
});

describe('safety-by-design engagement policy',()=>{
 it.each(['speed_score','miles_competition','drive_count_streak','leaderboard','trip_count_reward','in_drive_prompt'])('denies %s',mechanic=>{
   expect(engagementPolicy(mechanic).decision).toBe('DENY');
 });
});


describe('W40-W50 MVP workflow',()=>{
 it('routes next-best-step without inventing jurisdiction requirements',()=>{
  const state=initialState();
   state.consent.teenAcknowledged=true;
  expect(nextBestStep(state).id).toBe('safe_setup');
  state.safetyChecks.push(
   {topic:'phone_away',completedBy:'teen',completedAt:'x'},
   {topic:'seatbelt_setup',completedBy:'teen',completedAt:'x'},
   {topic:'mirrors_controls',completedBy:'teen',completedAt:'x'}
  );
  expect(nextBestStep(state).id).toBe('plan');
  state.activePlan={id:'p',skill:'Turns',objective:'Scan',supervisor:'Adult',createdAt:'x'};
  expect(nextBestStep(state).id).toBe('practice');
 });
 it('requires parent role for correction/dispute and removes disputed time from progress',()=>{
  const state=initialState();
   state.consent.guardianAcknowledged=true;
  state.logs.push({id:'entry',date:'2026-09-01',minutes:60,night:false,skill:'Turns',supervisor:'Adult',note:'',status:'verified',createdAt:'x'});
  expect(guard('correct','teen','parked',state,{id:'entry',minutes:45,reason:'Fix'}).decision).toBe('REQUIRE_PARENT');
  expect(guard('dispute','parent','parked',state,{id:'entry',reason:'Could not confirm'}).decision).toBe('ALLOW');
  state.logs[0].status='disputed';
  expect(guard('dispute','parent','parked',state,{id:'entry',reason:'Repeated'}).decision).toBe('DENY');
  expect(progress(state).verifiedMinutes).toBe(0);
 });
 it('keeps jurisdiction unverified without an official source',()=>{
  const state=initialState();
  expect(guard('jurisdiction','parent','parked',state,{name:'Example',officialSourceUrl:''}).decision).toBe('ALLOW');
  expect(guard('jurisdiction','parent','parked',state,{name:'Example',officialSourceUrl:'https://example.com'}).decision).toBe('REQUIRE_OFFICIAL_SOURCE');
 });
 it('activates COVER only as an educational handoff after evidence is present',()=>{
  const state=initialState();
  state.consent.guardianAcknowledged=true;
   state.consent.guardianAcknowledged=true;
  expect(coverStatus(state).active).toBe(false);
  state.logs.push({id:'entry',date:'2026-09-01',minutes:60,night:false,skill:'Turns',supervisor:'Adult',note:'',status:'verified',createdAt:'x'});
  state.safetyChecks.push(
   {topic:'phone_away',completedBy:'teen',completedAt:'x'},
   {topic:'seatbelt_setup',completedBy:'teen',completedAt:'x'},
   {topic:'mirrors_controls',completedBy:'teen',completedAt:'x'}
  );
  expect(coverStatus(state)).toMatchObject({active:true,quoteEnabled:false});
 });
 it('reports aggregate pilot analytics without ranking',()=>{
  const metrics=pilotAnalytics(initialState());
  expect(metrics).toHaveProperty('guardDeferrals');
  expect(metrics).not.toHaveProperty('rank');
  expect(metrics).not.toHaveProperty('score');
 });
});
