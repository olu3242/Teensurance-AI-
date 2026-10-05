import {describe,expect,it,vi} from 'vitest';

const all=vi.fn();
const put=vi.fn(async(_kind:string,value:unknown)=>value);
vi.mock('../platform/db',()=>({all,put}));

const guardian={id:'g',name:'Guardian',email:'g@example.com'};
const teen={id:'t',name:'Teen',email:'t@example.com'};

describe('insurance agentic runtime',()=>{
  it('routes quote requests to QUOTE through a versioned workflow',async()=>{
    all.mockResolvedValue([{id:'m',ownerId:'g',role:'guardian',active:true}]);
    const {routeInsuranceCommand}=await import('./runtime');
    const trace=await routeInsuranceCommand(guardian,{action:'quote.request',householdId:'h',source:'user'});
    expect(trace.agent).toBe('QUOTE');
    expect(trace.workflow).toBe('quote_marketplace');
    expect(trace.triggerId).toBe('insurance.quote.requested');
    expect(trace.decision).toBe('ALLOW');
    expect(put).toHaveBeenCalledWith('insurance_runtime_trace',expect.objectContaining({agent:'QUOTE'}));
  });

  it('GUARD blocks teen purchase actions',async()=>{
    all.mockResolvedValue([{id:'m',ownerId:'t',role:'teen',active:true}]);
    const {routeInsuranceCommand}=await import('./runtime');
    await expect(routeInsuranceCommand(teen,{action:'bind.prepare',householdId:'h',source:'user'})).rejects.toMatchObject({status:403});
    expect(put).toHaveBeenCalledWith('insurance_runtime_trace',expect.objectContaining({agent:'GUARD',decision:'REQUIRE_GUARDIAN'}));
  });

  it('requires carrier provenance for authoritative lifecycle changes',async()=>{
    all.mockResolvedValue([{id:'m',ownerId:'g',role:'guardian',active:true}]);
    const {routeInsuranceCommand}=await import('./runtime');
    await expect(routeInsuranceCommand(guardian,{action:'policy.active',householdId:'h',source:'user'})).rejects.toMatchObject({status:403});
    const trace=await routeInsuranceCommand(guardian,{action:'policy.active',householdId:'h',source:'carrier'});
    expect(trace.decision).toBe('ALLOW');
    expect(trace.workflowState).toBe('COMPLETED');
  });
});
