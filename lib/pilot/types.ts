import type {RecordBase} from '../platform/db';
export const pilotStatuses=['invited','onboarding','active','paused','completed','withdrawn'] as const;
export type PilotStatus=typeof pilotStatuses[number];
export type Cohort=RecordBase&{name:string;status:'planned'|'active'|'completed';startsAt?:string;endsAt?:string};
export type Enrollment=RecordBase&{cohortId:string;status:PilotStatus;jurisdiction:string;acknowledgedAt?:string;ackVersion?:string;orientation:boolean;createdAt:string;updatedAt:string};
export type PilotInvite=RecordBase&{hash:string;email:string;cohortId:string;expiresAt:string;acceptedBy?:string;status:'invited'|'consumed'};
export const acknowledgementVersion='pilot-safety-v1';
export const acknowledgements=['Teensurance is not an insurer.','Scout Learning is educational and does not certify legal driving eligibility.','Do not use the app while driving.','Guardians remain responsible for supervised practice.','The pilot may evolve during testing.'];
