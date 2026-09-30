import {defineConfig,devices} from '@playwright/test';
import {resolve} from 'node:path';

const database=process.env.SAVE_BROWSER_DB||resolve(`data/save-browser-${Date.now()}.sqlite`);
process.env.SAVE_BROWSER_DB=database;

export default defineConfig({
 testDir:'./e2e',
 testMatch:'save.spec.ts',
 workers:1,
 timeout:90000,
 expect:{timeout:15000},
 use:{baseURL:'http://127.0.0.1:3104',...devices['Desktop Chrome'],trace:'retain-on-failure'},
 webServer:{
  command:'npm run dev -- --hostname 127.0.0.1 --port 3104',
  url:'http://127.0.0.1:3104',
  reuseExistingServer:false,
  timeout:120000,
  env:{NEXT_DIST_DIR:'.next-save',TEENSURANCE_DB_PATH:database,TEENSURANCE_PERSISTENCE:'sqlite',PILOT_ENABLED:'true'}
 }
});
