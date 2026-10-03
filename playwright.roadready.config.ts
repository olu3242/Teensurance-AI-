import {defineConfig,devices} from '@playwright/test';
import {resolve} from 'node:path';
const database=process.env.ROADREADY_E2E_DB_PATH||resolve(`data/roadready-browser-${Date.now()}.sqlite`);
process.env.ROADREADY_E2E_DB_PATH=database;
export default defineConfig({testDir:'./e2e',testMatch:'roadready.spec.ts',workers:1,fullyParallel:false,timeout:60000,expect:{timeout:15000},use:{baseURL:'http://127.0.0.1:3101',trace:'retain-on-failure',...devices['Desktop Chrome']},reporter:[['list'],['json',{outputFile:'docs/ROADREADY_BROWSER_RESULTS.json'}]],webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port 3101',url:'http://127.0.0.1:3101',reuseExistingServer:false,timeout:120000,env:{NEXT_DIST_DIR:'.next-roadready',TEENSURANCE_DB_PATH:database,ROADREADY_LEARNING_ENABLED:'true',NEXT_PUBLIC_WAITLIST_MODE:'false'}}});
