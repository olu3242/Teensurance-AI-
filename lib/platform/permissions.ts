import type {Role} from './types';

export type CredOperation='create'|'read'|'edit'|'delete';
export type PermissionResource='profile.identity'|'profile.critical'|'practice'|'evidence'|'consent'|'relationship'|'household'|'reminder';

const matrix:Record<Role,Record<PermissionResource,readonly CredOperation[]>>={
 guardian:{
  'profile.identity':['create','read','edit'],
  'profile.critical':['create','read','edit'],
  practice:['read','edit'],
  evidence:['create','read','edit'],
  consent:['read','edit'],
  relationship:['create','read','edit'],
  household:['create','read','edit'],
  reminder:['create','read','edit']
 },
 teen:{
  'profile.identity':['read','edit'],
  'profile.critical':['read'],
  practice:['create','read','edit'],
  evidence:['create','read'],
  consent:['read'],
  relationship:['read'],
  household:['read'],
  reminder:['create','read','edit']
 },
 supervisor:{
  'profile.identity':[],
  'profile.critical':[],
  practice:['read','edit'],
  evidence:[],
  consent:[],
  relationship:['read'],
  household:['read'],
  reminder:[]
 }
};

export function can(role:Role,resource:PermissionResource,operation:CredOperation){
 return matrix[role][resource].includes(operation);
}

export function personaPermissions(role:Role){return matrix[role]}

export const criticalProfileFields=['birthDate','jurisdiction','stage','goalMinutes','permitDate','suspensionDays'] as const;

const commandPermissions:Partial<Record<string,{resource:PermissionResource;operation:CredOperation}>>={
 'invite.create':{resource:'relationship',operation:'create'},
 'consent.set':{resource:'consent',operation:'edit'},
 'relationship.revoke':{resource:'relationship',operation:'edit'},
 'drive.start':{resource:'practice',operation:'create'},
 'drive.manual':{resource:'practice',operation:'create'},
 'drive.end':{resource:'practice',operation:'edit'},
 'drive.cancel':{resource:'practice',operation:'edit'},
 'drive.submit':{resource:'practice',operation:'edit'},
 'drive.review':{resource:'practice',operation:'edit'},
 'drive.correct':{resource:'practice',operation:'edit'},
 'evidence.add':{resource:'evidence',operation:'create'},
 'evidence.review':{resource:'evidence',operation:'edit'},
 'reminder.create':{resource:'reminder',operation:'create'},
 'reminder.update':{resource:'reminder',operation:'edit'}
};

export function permissionForAction(action:string){return commandPermissions[action]}
