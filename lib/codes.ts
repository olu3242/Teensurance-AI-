import {randomBytes} from 'node:crypto';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function randomCode(prefix:string,length=8){const bytes=randomBytes(length);let out=prefix;for(let i=0;i<length;i++)out+=alphabet[bytes[i]%alphabet.length];return out;}
export const invitationCode=()=>randomCode('INV-',8);
export const referralCode=()=>randomCode('REF-',8);
export function normalizeCode(value:string){return value.trim().toUpperCase().replace(/\s+/g,'');}
export function validInvitationCode(value:string){return /^INV-[A-HJ-NP-Z2-9]{8}$/.test(normalizeCode(value));}
export function validReferralCode(value:string){return /^REF-[A-HJ-NP-Z2-9]{8}$/.test(normalizeCode(value));}
