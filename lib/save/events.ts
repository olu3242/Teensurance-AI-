import type {DomainEvent} from '@/lib/os/types';
import type {SavingsFacts} from './types';

export type SaveTriggerEvent =
  | 'driver_education.completed'
  | 'good_student.verified'
  | 'student_away.changed'
  | 'vehicle.assignment.changed'
  | 'mileage.changed'
  | 'telematics.preference.changed'
  | 'policy.baseline.captured'
  | 'policy.premium.changed'
  | 'policy.renewal_60_days'
  | 'policy.renewal_30_days'
  | 'policy.renewal_approaching';

const SAVE_EVENTS = new Set<SaveTriggerEvent>([
  'driver_education.completed',
  'good_student.verified',
  'student_away.changed',
  'vehicle.assignment.changed',
  'mileage.changed',
  'telematics.preference.changed',
  'policy.baseline.captured',
  'policy.premium.changed',
  'policy.renewal_60_days',
  'policy.renewal_30_days',
  'policy.renewal_approaching'
]);

export function isSaveTriggerEvent(event:DomainEvent):event is DomainEvent&{type:SaveTriggerEvent}{
  return SAVE_EVENTS.has(event.type as SaveTriggerEvent);
}

export type SaveEventEnvelope={
  event:DomainEvent&{type:SaveTriggerEvent};
  facts:SavingsFacts;
};

export function saveEvent(type:SaveTriggerEvent,subjectId?:string,metadata?:DomainEvent['metadata']):DomainEvent{
  return {type,subjectId,metadata};
}
