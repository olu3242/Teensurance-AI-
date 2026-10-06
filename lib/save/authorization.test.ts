import {describe,expect,it} from 'vitest';
import {saveRoleMessage} from './authorization';

describe('SAVE parent ownership',()=>{
 it('keeps insurance actions with guardian',()=>expect(saveRoleMessage('guardian')).toContain('Parent or guardian controls'));
 it('gives teens a non-actionable message',()=>expect(saveRoleMessage('teen')).toContain('parent or guardian manages'));
 it('gives supervisors no insurance authority',()=>expect(saveRoleMessage('supervisor')).toContain('parent or guardian manages'));
});
