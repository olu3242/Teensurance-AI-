import {describe,it,expect} from 'vitest';
import {journey,ageOn} from './journey';
import {texasRule} from './texas';
import {pennsylvaniaRule} from './pennsylvania';
import type {Profile,Evidence} from './types';
const p:Profile={id:'p',householdId:'h',ownerId:'t',name:'Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:1800,permitDate:'2026-01-01',suspensionDays:0,consent:true,consentVersion:'v1',adultSharing:false};
describe('sourced journey graph',()=>{
 it('never treats hours alone as licensing readiness',()=>{const j=journey(p,[],[],[texasRule],{verifiedMinutes:3000,nightMinutes:900},new Date('2026-09-27'));expect(j.milestones.find(m=>m.id==='license')?.status).toBe('BLOCKED');expect(j.milestones.find(m=>m.id==='practice')?.reason).toContain('not licensing eligibility')});
 it('requires official sources after the freshness window and outside jurisdiction',()=>{for(const profile of [p,{...p,jurisdiction:'OTHER'}]){const j=journey(profile,[],[],[texasRule],{verifiedMinutes:0,nightMinutes:0},new Date('2027-01-01'));expect(j.milestones.find(m=>m.id==='license')?.status).toBe('REQUIRES_OFFICIAL_SOURCE')}});
 it('recalculates dependencies and keeps pending evidence out of completion',()=>{const evidence:Evidence={id:'e',householdId:'h',ownerId:'t',teenId:'t',milestone:'prepare',description:'Completed preparation',sourceUrl:'',provenance:'SELF_REPORTED',status:'pending',createdAt:'2026-09-27T00:00:00Z'};expect(journey(p,[],[evidence],[texasRule],{verifiedMinutes:0,nightMinutes:0}).milestones[0].status).toBe('AWAITING_VERIFICATION');expect(journey(p,[],[{...evidence,status:'accepted'}],[texasRule],{verifiedMinutes:0,nightMinutes:0}).milestones[0].status).toBe('COMPLETED')});
 it('keeps Pennsylvania requirements distinct from Texas',()=>{const pa={...p,jurisdiction:'PA',goalMinutes:3900};const evidence=['prepare','learn','documents','test'].map((milestone,i)=>({id:`pa-${i}`,householdId:'h',ownerId:'t',teenId:'t',milestone,description:'verified',sourceUrl:'',provenance:'SELF_REPORTED' as const,status:'accepted' as const,createdAt:'2026-09-01T00:00:00Z'}));const j=journey(pa,[],evidence,[texasRule,pennsylvaniaRule],{verifiedMinutes:3900,nightMinutes:600},new Date('2026-10-03'));expect(j.rule?.jurisdiction).toBe('PA');expect(j.rule?.totalMinutes).toBe(3900);expect(j.rule?.weatherMinutes).toBe(300)});
 it('handles age boundaries without assuming guardian access continues',()=>{expect(ageOn('2008-09-28',new Date('2026-09-27'))).toBe(17);expect(ageOn('2008-09-28',new Date('2026-09-28'))).toBe(18)});
});
