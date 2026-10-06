import {AppError} from './auth';
import type {User} from './types';

function configuredIds(name:string){
 return (process.env[name]||'').split(',').map(s=>s.trim()).filter(Boolean);
}

export function isPlatformAdmin(user:User|string){
 const id=typeof user==='string'?user:user.id;
 return configuredIds('TEENSURANCE_ADMIN_USER_IDS').includes(id);
}

export function requireAdmin(user:User){
 if(!isPlatformAdmin(user))throw new AppError('Administrator access required.',403);
}

export function requireReviewer(user:User){
 const ids=configuredIds('TEENSURANCE_REVIEWER_USER_IDS');
 if(!ids.includes(user.id)&&!isPlatformAdmin(user))throw new AppError('Authorized reviewer access required.',403);
}
