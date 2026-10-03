import type {Rule} from './types';
// Source-reviewed snapshot, not a determination of legal eligibility.
export const texasRule:Rule={id:'tx-provisional-2026-09-27',householdId:'public',ownerId:'content',jurisdiction:'TX',stateName:'Texas',legalRequirements:[{id:'tx-hold',kind:'holding_period',label:'Hold the learner license for at least 6 months.',stages:['permit']},{id:'tx-practice',kind:'practice',label:'Complete 30 hours of supervised practice, including 10 hours at night.',stages:['permit']},{id:'tx-education',kind:'education',label:'Complete the applicable Texas driver education requirements.',stages:['pre-permit','permit']},{id:'tx-ittd',kind:'test',label:'Complete Impact Texas Teen Drivers (ITTD) within the applicable window before the driving test.',stages:['permit']},{id:'tx-provisional-night',kind:'restriction',label:'Provisional-license driving is restricted between midnight and 5 a.m. except for permitted purposes.',stages:['licensed']},{id:'tx-provisional-passenger',kind:'restriction',label:'Provisional-license passenger restrictions apply to non-family passengers under age 21.',stages:['licensed']}],aliases:['US-TX'],version:'2026-09-27.1',sourceUrl:'https://www.dps.texas.gov/section/driver-license/texas-provisional-license-teen',sourceTitle:'Texas DPS — Provisional License as a Teen',reviewedAt:'2026-09-27T00:00:00Z',validUntil:'2026-12-26T00:00:00Z',effectiveFrom:'2026-09-27',learnerMinimumAge:15,minimumAge:16,holdingMonths:6,totalMinutes:1800,nightMinutes:600,requiredEvidence:['education','impact','test','documents'],authorityLabel:'Texas DPS',status:'verified',reviewedBy:'Repository source review, 2026-09-27'};
export const texasChecklist=[
 'This provisional pathway applies to ages 16–17.',
 'Hold the learner license for six months; suspension days extend the period.',
 'Practice: 30 hours including 10 at night, with a licensed adult aged 21 or older.',
 'Driver education includes separate seven-hour instruction and observation components.',
 'Complete ITTD within 90 days of the driving test.',
 'Review testing, education certificates, identity, enrollment, vehicle documents, and application requirements with DPS.',
];
export const learnerSource='https://www.dps.texas.gov/section/driver-license/texas-learners-license-teen';
