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
