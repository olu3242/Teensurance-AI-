import {it,expect} from 'vitest';
import {GET,POST} from './route';
it('rejects unauthenticated requests even with identity headers',async()=>{const headers={'x-role':'guardian','x-user-id':'forged',origin:'http://localhost','content-type':'application/json'};expect((await GET(new Request('http://localhost/api/roadready/intelligence?householdId=forged',{headers}))).status).toBe(401);expect((await POST(new Request('http://localhost/api/roadready/intelligence',{method:'POST',headers,body:'{}'}))).status).toBe(401)});
