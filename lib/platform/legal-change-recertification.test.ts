import {describe,it,expect} from 'vitest';
import {assessPromotedRule,runtimeEligiblePromotedRules} from './legal-change-recertification';
import type {PromotedLegalRule} from './legal-rule-promotion';
import type {LegalSourceCandidate} from './legal-source-queue';
const source={id:'11111111-1111-4111-8111-111111111111',householdId:'',ownerId:'r',jurisdiction:'CA',stateName:'California',authority:'California DMV',sourceTitle:'Teen drivers',sourceUrl:'https://www.dmv.ca.gov/',sourceType:'dmv',priority:1,status:'accepted',note:'',createdAt:'',updatedAt:''} as LegalSourceCandidate;
const promoted={id:'p',householdId:'',ownerId:'r',draftId:'d',jurisdiction:'CA',version:'1',sourceIds:[source.id],promotedAt:'',promotedBy:'r',provenance:[],rule:{id:'ca-1',householdId:'public',ownerId:'content',jurisdiction:'CA',version:'1',sourceUrl:source.sourceUrl,sourceTitle:source.sourceTitle,reviewedAt:'2026-10-01T00:00:00Z',validUntil:'2027-01-01T00:00:00Z',effectiveFrom:'2026-10-01',minimumAge:16,totalMinutes:3000,nightMinutes:600,status:'verified',lifecycleStatus:'published',reviewedBy:'r'}} as PromotedLegalRule;
describe('legal change recertification',()=>{
 it('keeps a current rule eligible while its sources remain accepted',()=>{expect(assessPromotedRule(promoted,[source],new Date('2026-10-03T00:00:00Z'))).toEqual([]);expect(runtimeEligiblePromotedRules([promoted],[source],new Date('2026-10-03T00:00:00Z'))).toHaveLength(1)});
 it('fails closed immediately when a cited source is superseded',()=>{const changed={...source,status:'superseded' as const};expect(assessPromotedRule(promoted,[changed],new Date('2026-10-03T00:00:00Z'))).toContain('source_superseded');expect(runtimeEligiblePromotedRules([promoted],[changed],new Date('2026-10-03T00:00:00Z'))).toHaveLength(0)});
 it('detects source and rule expiry independently',()=>{const expiring={...source,effectiveTo:'2026-10-02'};expect(assessPromotedRule(promoted,[expiring],new Date('2027-02-01T00:00:00Z'))).toEqual(expect.arrayContaining(['source_expired','rule_expired']))});
 it('fails closed when provenance source disappears',()=>{expect(assessPromotedRule(promoted,[],new Date('2026-10-03T00:00:00Z'))).toContain('source_missing')});
});
