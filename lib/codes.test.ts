import {describe,expect,it} from 'vitest';
import {invitationCode,normalizeCode,referralCode,validInvitationCode,validReferralCode} from './codes';
describe('invitation and referral codes',()=>{
 it('generates invitation codes in the public contract',()=>{for(let i=0;i<100;i++)expect(validInvitationCode(invitationCode())).toBe(true)});
 it('generates referral codes in the public contract',()=>{for(let i=0;i<100;i++)expect(validReferralCode(referralCode())).toBe(true)});
 it('normalizes human-entered codes without ambiguous characters',()=>{expect(normalizeCode(' inv-abcd2345 ')).toBe('INV-ABCD2345')});
 it('keeps invite and referral namespaces separate',()=>{expect(validInvitationCode(referralCode())).toBe(false);expect(validReferralCode(invitationCode())).toBe(false)});
});
