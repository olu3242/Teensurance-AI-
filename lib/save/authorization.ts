import {all} from '@/lib/platform/db';
import {AppError} from '@/lib/platform/auth';
import type {Member,User} from '@/lib/platform/types';

export async function requireSaveGuardian(user:User,householdId:string){
 const member=(await all<Member>('member',householdId)).find(m=>m.ownerId===user.id&&m.active);
 if(!member)throw new AppError('Household access denied.',403);
 if(member.role!=='guardian')throw new AppError('SAVE insurance actions are managed by a parent or guardian.',403);
 return member;
}

export function saveRoleMessage(role:'guardian'|'teen'|'supervisor'){
 return role==='guardian'
  ?'Parent or guardian controls insurance savings actions.'
  :'Your parent or guardian manages insurance savings, quotes, consent and coverage decisions.';
}
