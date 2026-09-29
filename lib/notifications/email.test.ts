import {describe,it,expect} from 'vitest';
import {emailTemplate} from './email';

describe('transactional email templates',()=>{
 it('uses Teensurance lime branding and safe waitlist language',()=>{
  const mail=emailTemplate({event:'waitlist.joined',to:'parent@example.test',name:'Parent'});
  expect(mail.subject).toMatch(/waitlist/i);
  expect(mail.html).toContain('#ceff59');
  expect(mail.html).toContain('does not determine insurance eligibility');
 });
 it('renders milestone and practice events without claiming official eligibility',()=>{
  const milestone=emailTemplate({event:'milestone.completed',to:'teen@example.test',name:'Teen',milestone:'practice'});
  expect(milestone.subject).toMatch(/Milestone/i);
  expect(milestone.html).toContain('does not create an official licensing or insurance decision');
  const review=emailTemplate({event:'drive.awaiting_review',to:'parent@example.test',teenName:'Teen'});
  expect(review.html).toContain('submitted a supervised practice session');
 });
});
