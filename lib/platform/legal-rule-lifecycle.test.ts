import {describe,it,expect} from 'vitest';
import {resolveRuleLifecycle} from './legal-rule-lifecycle';

describe('legal rule lifecycle',()=>{
 it('fails closed after a rule expires',()=>{const r=resolveRuleLifecycle('TX',[],new Date('2027-01-02T00:00:00Z'));expect(r.status).toBe('stale');expect(r.rule).toBeUndefined();expect(r.reason).toContain('re-verified')});
 it('does not expose an unpublished reviewed rule',()=>{const base=resolveRuleLifecycle('PA',[],new Date('2026-10-03T12:00:00Z'));expect(base.rule).toBeDefined();const rule=base.rule!;const review={id:'x',householdId:'',ownerId:'r',ruleId:rule.id,digest:createHash('sha256').update(JSON.stringify(rule)).digest('hex'),jurisdiction:'PA',version:rule.version,status:'review' as const,reviewer:'',reviewedAt:'',publishedAt:'',note:'review',sourceUrl:rule.sourceUrl,snapshot:rule};const r=resolveRuleLifecycle('PA',[review],new Date('2026-10-03T12:00:00Z'));expect(r.status).toBe('unpublished');expect(r.rule).toBeUndefined()});
 it('marks unsupported jurisdictions explicitly',()=>expect(resolveRuleLifecycle('CA',[]).status).toBe('unsupported'));
});
