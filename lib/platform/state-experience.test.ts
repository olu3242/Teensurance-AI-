import {describe,it,expect} from 'vitest';
import {resolveStateExperience} from './state-experience';
import {texasRule} from './texas';
import {pennsylvaniaRule} from './pennsylvania';
import type {Profile} from './types';

const profile=(jurisdiction:string,stage:Profile['stage']):Profile=>({
 id:'p',householdId:'h',ownerId:'t',name:'Teen',birthDate:'2010-01-01',jurisdiction,stage,
 goalMinutes:1800,permitDate:'2026-01-01',suspensionDays:0,consent:true,consentVersion:'v1',adultSharing:false
});

describe('state-driven legal experience',()=>{
 it('renders Texas requirements without Pennsylvania-only poor-weather law',()=>{
  const x=resolveStateExperience(profile('TX','permit'),texasRule)!;
  expect(x.stateName).toBe('Texas');
  expect(x.legalRequirements.some(r=>r.label.includes('30 hours'))).toBe(true);
  expect(x.legalRequirements.some(r=>r.label.toLowerCase().includes('poor weather'))).toBe(false);
 });
 it('renders Pennsylvania requirements without Texas ITTD leakage',()=>{
  const x=resolveStateExperience(profile('PA','permit'),pennsylvaniaRule)!;
  expect(x.stateName).toBe('Pennsylvania');
  expect(x.legalRequirements.some(r=>r.label.includes('65 hours'))).toBe(true);
  expect(x.legalRequirements.some(r=>r.label.includes('5 hours')&&r.label.toLowerCase().includes('weather'))).toBe(true);
  expect(x.legalRequirements.some(r=>r.label.includes('ITTD'))).toBe(false);
 });
 it('changes restrictions with the selected stage',()=>{
  const permit=resolveStateExperience(profile('PA','permit'),pennsylvaniaRule)!;
  const licensed=resolveStateExperience(profile('PA','licensed'),pennsylvaniaRule)!;
  expect(permit.legalRequirements.some(r=>r.id==='pa-junior-night')).toBe(false);
  expect(licensed.legalRequirements.some(r=>r.id==='pa-junior-night')).toBe(true);
 });
});
