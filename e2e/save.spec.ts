import {test,expect,type BrowserContext} from '@playwright/test';
import {randomUUID} from 'node:crypto';

const origin='http://127.0.0.1:3104';
async function post(c:BrowserContext,path:string,data:unknown){
 const r=await c.request.post(path,{headers:{origin,'idempotency-key':randomUUID()},data});
 expect(r.status(),await r.text()).toBe(200);
 return r.json();
}

test('parent owns SAVE and teen cannot operate insurance savings',async({browser})=>{
 const parent=await browser.newContext();const teen=await browser.newContext();
 await post(parent,'/api/auth',{action:'register',email:'save-parent@example.test',password:'long-password-123',name:'SAVE Parent'});
 await post(teen,'/api/auth',{action:'register',email:'save-teen@example.test',password:'long-password-123',name:'SAVE Teen'});
 const teenUser=(await (await teen.request.get('/api/workspace')).json()).user;
 const household=(await post(parent,'/api/workspace',{action:'household.create',name:'SAVE family',adultAttestation:true})).result.id;
 const invite=(await post(parent,'/api/workspace',{action:'invite.create',householdId:household,role:'teen'})).result;
 await post(teen,'/api/workspace',{action:'invite.accept',token:invite.token});
 await post(teen,'/api/workspace',{action:'profile.save',householdId:household,teenId:teenUser.id,name:'SAVE Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:1800,permitDate:'2026-01-01',suspensionDays:0});

 const parentPage=await parent.newPage();await parentPage.goto('/dashboard/parent/save');
 await expect(parentPage.getByText('SAVE / FAMILY COST CONTROL')).toBeVisible();
 await expect(parentPage.getByText('Guardian-only SAVE workspace')).toBeVisible();

 const teenPage=await teen.newPage();await teenPage.goto('/dashboard/teen');
 await expect(teenPage.getByText('Your parent manages insurance and savings.')).toBeVisible();
 expect((await teen.request.get('/api/save?household='+household)).status()).toBe(403);

 await parentPage.setViewportSize({width:375,height:812});
 expect(await parentPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await parent.close();await teen.close();
});


test('platform admin inspects SAVE end to end without becoming the insurance actor',async({browser})=>{
 const parent=await browser.newContext();const teen=await browser.newContext();const admin=await browser.newContext();

 await post(parent,'/api/auth',{action:'register',email:'save-e2e-parent@example.test',password:'long-password-123',name:'SAVE E2E Parent'});
 await post(teen,'/api/auth',{action:'register',email:'save-e2e-teen@example.test',password:'long-password-123',name:'SAVE E2E Teen'});
 await post(admin,'/api/auth',{action:'login',email:'save-admin@example.test',password:'admin-password-123'});

 const teenUser=(await (await teen.request.get('/api/workspace')).json()).user;
 const household=(await post(parent,'/api/workspace',{action:'household.create',name:'SAVE E2E family',adultAttestation:true})).result.id;
 const invite=(await post(parent,'/api/workspace',{action:'invite.create',householdId:household,role:'teen'})).result;
 await post(teen,'/api/workspace',{action:'invite.accept',token:invite.token});
 await post(teen,'/api/workspace',{action:'profile.save',householdId:household,teenId:teenUser.id,name:'SAVE E2E Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:1800,permitDate:'2026-01-01',suspensionDays:0});

 await post(parent,'/api/save',{
  action:'policy_baseline.save',householdId:household,carrierName:'Baseline Carrier',annualPremium:2400,
  renewalDate:'2026-12-15',coverageFingerprint:'100-300-100|500|comp-collision',deductible:500,
  drivers:2,vehicles:1,currentDiscounts:['multi_vehicle'],source:'manual'
 });
 const quote=await post(parent,'/api/save',{
  action:'quote.capture',householdId:household,provider:'Comparable Carrier',annualPremium:1800,
  coverageFingerprint:'100-300-100|500|comp-collision',source:'quote'
 });
 await post(parent,'/api/save',{action:'savings.verify',householdId:household,quoteId:quote.id});

 expect((await teen.request.get('/api/save?household='+household)).status()).toBe(403);
 expect((await teen.request.get('/api/admin/save')).status()).toBe(403);

 const summaryResponse=await admin.request.get('/api/admin/save');
 expect(summaryResponse.status(),await summaryResponse.text()).toBe(200);
 const summary=await summaryResponse.json();
 expect(summary.mode).toBe('summary');
 expect(summary.households.some((x:{householdId:string})=>x.householdId===household)).toBe(true);

 const adminPage=await admin.newPage();
 await adminPage.goto('/admin/save');
 await expect(adminPage.getByRole('heading',{name:'SAVE operations'})).toBeVisible();
 await expect(adminPage.getByText('Platform-admin inspection only.')).toBeVisible();
 await expect(adminPage.getByText(household)).toBeVisible();
 await adminPage.getByRole('button',{name:'Inspect SAVE household'}).click();
 await expect(adminPage.getByRole('heading',{name:'Household inspection'})).toBeVisible();
 await expect(adminPage.getByText('Verified annual savings:')).toBeVisible();
 await expect(adminPage.getByText('$600')).toBeVisible();
 await expect(adminPage.getByRole('heading',{name:'Verified savings ledger'})).toBeVisible();
 await expect(adminPage.getByText('Comparable Carrier')).toBeVisible();

 await parent.close();await teen.close();await admin.close();
});
