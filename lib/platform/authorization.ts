import {owned,db} from './db';
import {AppError} from './auth';
import {ageOn} from './journey';
import type {Member,Profile,Relationship,User} from './types';

// IDs select a scope; only persisted membership and relationships authorize it.
export async function authorizeLearner(user:User,householdId?:string,teenId?:string){
 const rows=(await db().prepare("SELECT payload FROM records WHERE kind='member' AND owner_id=?").all(user.id));
 const memberships=rows.map(r=>JSON.parse(String(r.payload)) as Member).filter(m=>m.active);
 const member=householdId?memberships.find(m=>m.householdId===householdId):memberships[0];
 if(!member)throw new AppError('Learning access denied.',403);
 const household=member.householdId;
 const links=(await owned<Relationship>('relationship',household,user.id)).filter(r=>r.active&&r.kind==='guardian'&&r.adultId===user.id);
 const target=teenId||(member.role==='teen'?user.id:links[0]?.teenId);
 const guardian=member.role==='guardian'&&links.some(r=>r.teenId===target);
 if(!target||(!(member.role==='teen'&&target===user.id)&&!guardian))throw new AppError('Learning access denied.',403);
 const teen=(await owned<Member>('member',household,target)).find(m=>m.active&&m.role==='teen'&&m.ownerId===target);
 if(!teen)throw new AppError('Learning access denied.',403);
 const profile=(await owned<Profile>('profile',household,target)).find(p=>p.ownerId===target);
 if(!profile)throw new AppError('Complete the driver profile first.',409);
 if(ageOn(profile.birthDate)>=18&&user.id!==target&&!profile.adultSharing)throw new AppError('Learning access denied.',403);
 return {householdId:household,teenId:target,member,profile,guardian};
}
