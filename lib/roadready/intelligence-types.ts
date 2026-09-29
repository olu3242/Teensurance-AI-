import type {RecordBase} from '../platform/db';
export const safeContexts=['AT_HOME','PARKED','PRE_DRIVE','POST_DRIVE'] as const;
export type SafeContext=typeof safeContexts[number];
export type PracticeSession=RecordBase&{teenId:string;kind:'hazard'|'permit'|'review';jurisdiction:string;itemIds:string[];cursor:number;startedAt:string;completedAt?:string;recommendationId?:string};
export type PracticeAttempt=RecordBase&{teenId:string;sessionId:string;itemId:string;conceptId:string;correct:boolean;explanation:string;version:string;at:string};
export type CoachActivity=RecordBase&{teenId:string;conceptId:string;title:string;context:SafeContext;status:'recommended'|'started'|'completed'|'needs_more_practice';startedAt?:string;completedAt?:string;guardianId:string};
export const recommendationTypes=['practice_concept','retry_weak_concept','continue_category','start_hazard_scene','guardian_reinforcement','resume_session','review_before_drive'] as const;
export type Recommendation=RecordBase&{teenId:string;type:typeof recommendationTypes[number];conceptId:string;title:string;reason:string;priority:number;status:'recommended'|'started'|'completed'|'dismissed'|'expired'|'superseded';createdAt:string;expiresAt:string};
