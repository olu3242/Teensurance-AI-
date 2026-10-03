import {randomUUID} from 'node:crypto';
import type {DrivingState,Role,State} from '@/lib/domain';

export type NotificationIntent={kind:'parent_review'|'reflection'|'safety'|'requirement_review';recipient:Role;reason:string};

export function notificationPolicy(state:State,drivingState:DrivingState,intent:NotificationIntent){
 if(drivingState==='driving')return{status:'deferred' as const,reason:'All non-emergency Teensurance prompts are deferred while driving.'};
 if(intent.recipient==='teen'&&!state.consent.teenAcknowledged)return{status:'suppressed' as const,reason:'Teen pilot acknowledgment is missing.'};
 if(intent.recipient==='parent'&&!state.consent.guardianAcknowledged)return{status:'suppressed' as const,reason:'Guardian pilot acknowledgment is missing.'};
 return{status:'queued' as const,reason:intent.reason};
}

export function queueNotification(state:State,drivingState:DrivingState,intent:NotificationIntent,now=new Date().toISOString()){
 const decision=notificationPolicy(state,drivingState,intent);
 const record={id:randomUUID(),kind:intent.kind,recipient:intent.recipient,status:decision.status,reason:decision.reason,createdAt:now};
 state.notifications.unshift(record);
 return record;
}
