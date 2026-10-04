import {describe,expect,it,vi,beforeEach} from 'vitest';

const all=vi.fn();
const put=vi.fn(async(_kind:string,value:unknown)=>value);
const userById=vi.fn();
const renewalOpportunities=vi.fn();
const generateInsuranceNotifications=vi.fn();
const routeDomainCommand=vi.fn();
vi.mock('../platform/db',()=>({all,put}));
vi.mock('../platform/auth',()=>({userById}));
vi.mock('./renewal',()=>({renewalOpportunities}));
vi.mock('./notifications',()=>({generateInsuranceNotifications}));
vi.mock('./runtime',()=>({routeDomainCommand}));

describe('insurance trigger recovery',()=>{
  beforeEach(()=>{vi.clearAllMocks();renewalOpportunities.mockResolvedValue([]);generateInsuranceNotifications.mockResolvedValue({created:[],notifications:[],suppressed:0})});
  it('executes a due trigger once with correlation',async()=>{
    all.mockResolvedValue([{id:'tr1',householdId:'h',ownerId:'g',action:'renewal.detect',subjectId:'p',dueAt:'2026-10-01T00:00:00Z',sourceEventId:'e',status:'SCHEDULED',createdAt:'x'}]);
    userById.mockResolvedValue({id:'g',name:'G',email:'g@example.com'});
    routeDomainCommand.mockResolvedValue({id:'trace'});
    const {executeDueInsuranceTriggers}=await import('./scheduler');
    const result=await executeDueInsuranceTriggers(new Date('2026-10-04T00:00:00Z'));
    expect(result[0]).toMatchObject({triggerId:'tr1',status:'EXECUTED'});
    expect(put).toHaveBeenCalledWith('insurance_scheduled_trigger',expect.objectContaining({status:'EXECUTED',attempts:1,correlationId:expect.any(String)}));
  });
  it('backs off failures and dead-letters the third attempt',async()=>{
    userById.mockRejectedValue(new Error('temporary dependency failure'));
    all.mockResolvedValue([{id:'tr2',householdId:'h',ownerId:'g',action:'renewal.detect',subjectId:'p',dueAt:'2026-10-01T00:00:00Z',sourceEventId:'e',status:'RETRY',attempts:2,correlationId:'corr',createdAt:'x'}]);
    const {executeDueInsuranceTriggers}=await import('./scheduler');
    const result=await executeDueInsuranceTriggers(new Date('2026-10-04T00:00:00Z'));
    expect(result[0]).toMatchObject({triggerId:'tr2',status:'DEAD_LETTER',correlationId:'corr'});
    expect(put).toHaveBeenCalledWith('insurance_runtime_failure',expect.objectContaining({attempt:3,status:'DEAD_LETTER'}));
  });
});
