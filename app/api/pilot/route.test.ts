import {describe,it,expect} from 'vitest';
import {GET,POST} from './route';
describe('retired unsafe pilot API',()=>{it('does not expose old shared records or allow client-selected-role writes',async()=>{expect((await GET()).status).toBe(410);expect((await POST()).status).toBe(410)})});
