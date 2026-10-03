import {describe,it,expect} from 'vitest';
import {projectEvidenceCarryover,projectPractice} from './practice';
import {texasRule} from './texas';
import {pennsylvaniaRule} from './pennsylvania';

describe('jurisdiction practice projections',()=>{
 it('keeps family evidence distinct from state requirements',()=>{
  const pa=projectPractice(pennsylvaniaRule,{verifiedMinutes:3600,nightMinutes:600,weatherMinutes:120})!;
  expect(pa.complete).toBe(false);
  expect(pa.remaining).toEqual({verifiedMinutes:300,nightMinutes:0,weatherMinutes:180});
  expect(pa.nextAction?.category).toBe('total');
  expect(pa.claim).toContain('does not establish legal eligibility');
 });
 it('preserves verified evidence across a state change without claiming reciprocity',()=>{
  const moved=projectEvidenceCarryover(texasRule,pennsylvaniaRule,{verifiedMinutes:1800,nightMinutes:600,weatherMinutes:0});
  expect(moved.preserved.verifiedMinutes).toBe(1800);
  expect(moved.destination?.remaining).toEqual({verifiedMinutes:2100,nightMinutes:0,weatherMinutes:300});
  expect(moved.claim).toContain('not a determination');
 });
});
