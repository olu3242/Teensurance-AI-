import {describe,it,expect} from 'vitest';
import {guard,initialState,progress} from './domain';
describe('GUARD and supervised progress',()=>{
 it('defers every action while driving',()=>{for(const action of ['log','verify','goal']) expect(guard(action,'parent','driving',initialState(),{}).decision).toBe('DEFER')});
 it('requires a parent to verify and leaves pending time out of progress',()=>{
  const state=initialState();state.logs.push({id:'entry',date:'2026-09-01',minutes:60,night:true,skill:'Turns',supervisor:'Adult',note:'',status:'pending',createdAt:'2026-09-01T12:00:00Z'});
  expect(guard('verify','teen','parked',state,{id:'entry'}).decision).toBe('REQUIRE_PARENT');
  expect(progress(state).verifiedMinutes).toBe(0);
  expect(guard('verify','parent','parked',state,{id:'entry'}).decision).toBe('ALLOW');
  state.logs[0].status='verified';expect(progress(state)).toMatchObject({verifiedMinutes:60,nightMinutes:60,pending:0,percent:5});
 });
 it('requires supervisor and parent goal control',()=>{
  expect(guard('log','teen','parked',initialState(),{}).decision).toBe('REQUIRE_VERIFICATION');
  expect(guard('goal','teen','parked',initialState(),{}).decision).toBe('REQUIRE_PARENT');
 });
});
