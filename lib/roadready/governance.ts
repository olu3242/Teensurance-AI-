import {contentVisibility,requiresHumanReview} from './review-context';
export const contentStatuses=['draft','review','approved','published','retired'] as const;
export type ContentStatus=typeof contentStatuses[number];
export interface GovernedMetadata {status:ContentStatus;version:string;contentType:'core'|'jurisdiction';source:string;sourceUrl:string;reviewedAt?:string;reviewedBy?:string;effectiveDate?:string}
export function published(c:GovernedMetadata){return (!requiresHumanReview()||contentVisibility.getStore()?.has((c as GovernedMetadata&{id:string}).id)===true)&&c.status==='published'&&!!c.version&&!!c.source&&/^https:\/\//.test(c.sourceUrl)}
export function available<T extends GovernedMetadata&{jurisdiction:string}>(items:T[],jurisdiction:string){return items.filter(c=>published(c)&&(c.jurisdiction==='CORE'||c.jurisdiction===jurisdiction))}
