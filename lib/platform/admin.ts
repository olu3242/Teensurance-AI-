import {AppError} from './auth';
import type {User} from './types';
export function requireAdmin(user:User){const ids=(process.env.TEENSURANCE_ADMIN_USER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);if(!ids.includes(user.id))throw new AppError('Administrator access required.',403)}
export function requireReviewer(user:User){const ids=(process.env.TEENSURANCE_REVIEWER_USER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);if(!ids.includes(user.id))throw new AppError('Authorized reviewer access required.',403)}
