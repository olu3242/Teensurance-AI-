import type {RecordBase} from '../platform/db';
export const categories = ['regulatory_sign','warning_sign','guide_sign','road_marking','traffic_signal','dashboard_symbol','intersection','right_of_way','hazard_awareness','safe_response'] as const;
export type LearningCategory = typeof categories[number];
export type MasteryState = 'not_started'|'introduced'|'practicing'|'demonstrated'|'reinforced';
export const modes = ['Sign Snap','Symbol Match','Road Markings','Signal Sense','What Would You Do?'] as const;
export type GameMode = typeof modes[number];
export interface RoadLearningConcept {id:string;jurisdiction:string;category:LearningCategory;name:string;description:string;explanation:string;imageAsset:string;assetLabel:string;tags:string[];difficulty:1|2|3;active:boolean;sourceUrl:string;sourceSection:string;contentVersion:string}
export interface LearningChallenge {id:string;conceptId:string;mode:GameMode;prompt:string;options:{id:string;text:string}[];answerId:string;explanation:string;variant:number}
export type LearningEvidence = RecordBase & {teenId:string;conceptId:string;sessionId:string;challengeId:string;answerId:string;correct:boolean;at:string;kind:'learning';contentVersion:string};
export type GuardianReinforcement = RecordBase & {teenId:string;conceptId:string;at:string;kind:'guardian';completed:boolean;context:'PARKED'|'SUPERVISED_PRE_DRIVE';guardianId:string};
export type LearningSession = RecordBase & {teenId:string;mode:GameMode;jurisdiction:string;challengeIds:string[];cursor:number;startedAt:string;completedAt?:string};
export type ConceptMastery = {conceptId:string;state:MasteryState;qualifyingObservations:number;evidenceIds:string[];retryAt?:string};
export type ScoutRecommendation = RecordBase & {teenId:string;agent:'SCOUT';conceptId:string;mode:GameMode;reason:string;at:string;acceptedAt?:string};
