import type {Role} from './types';

export type CredOperation='create'|'read'|'edit'|'delete';
export type PermissionResource='profile.identity'|'profile.critical'|'practice'|'evidence'|'consent'|'relationship'|'household';

const matrix:Record<Role,Record<PermissionResource,readonly CredOperation[]>>={
 guardian:{
  'profile.identity':['create','read','edit'],
  'profile.critical':['create','read','edit'],
  practice:['read'],
  evidence:['create','read','edit'],
  consent:['read','edit'],
  relationship:['create','read','edit'],
  household:['create','read','edit']
 },
 teen:{
  'profile.identity':['read','edit'],
  'profile.critical':['read'],
  practice:['create','read','edit'],
  evidence:['create','read'],
  consent:['read'],
  relationship:['read'],
  household:['read']
 },
 supervisor:{
  'profile.identity':[],
  'profile.critical':[],
  practice:['read','edit'],
  evidence:[],
  consent:[],
  relationship:['read'],
  household:['read']
 }
};

export function can(role:Role,resource:PermissionResource,operation:CredOperation){
 return matrix[role][resource].includes(operation);
}

export function personaPermissions(role:Role){
 return matrix[role];
}

export const criticalProfileFields=['birthDate','jurisdiction','stage','goalMinutes','permitDate','suspensionDays'] as const;
