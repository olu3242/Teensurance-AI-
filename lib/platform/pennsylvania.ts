import type {Rule} from './types';

// Source-reviewed snapshot for product guidance only; not a legal eligibility determination.
export const pennsylvaniaRule:Rule={
 id:'pa-junior-2026-10-03',
 householdId:'public',
 ownerId:'content',
 jurisdiction:'PA',
 aliases:['US-PA'],
 version:'2026-10-03.1',
 sourceUrl:'https://www.pa.gov/agencies/penndot/traveling-in-pa/safety/traffic-safety-driver-topics/young-driver',
 sourceTitle:'PennDOT - Young Driver',
 reviewedAt:'2026-10-03T00:00:00Z',
 validUntil:'2027-01-01T00:00:00Z',
 effectiveFrom:'2026-10-03',
 learnerMinimumAge:16,
 minimumAge:16,
 holdingMonths:6,
 totalMinutes:3900,
 nightMinutes:600,
 weatherMinutes:300,
 requiredEvidence:['documents','test'],
 authorityLabel:'PennDOT',
 status:'verified',
 reviewedBy:'Repository source review, 2026-10-03'
};

export const pennsylvaniaChecklist=[
 'For drivers under 18, hold the learner permit for at least six months before the road test.',
 'Complete 65 hours of adult-supervised skill building.',
 'The 65 hours include at least 10 hours at night and 5 hours in poor weather.',
 'A parent or guardian certifies the supervised skill-building requirement on PennDOT form DL-180C.',
 'Confirm current road-test documents, supervision rules, passenger limits and nighttime restrictions directly with PennDOT.',
];
