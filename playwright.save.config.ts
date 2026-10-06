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
  command:'node scripts/seed-save-e2e-admin.mjs && npm run dev -- --hostname 127.0.0.1 --port 3104',
  url:'http://127.0.0.1:3104',
  reuseExistingServer:false,
  timeout:120000,
  env:{NEXT_DIST_DIR:'.next-save',TEENSURANCE_DB_PATH:database,SAVE_BROWSER_DB:database,TEENSURANCE_PERSISTENCE:'sqlite',PILOT_ENABLED:'true',TEENSURANCE_ADMIN_USER_IDS:'00000000-0000-4000-8000-000000000001',SAVE_E2E_ADMIN_ID:'00000000-0000-4000-8000-000000000001',SAVE_E2E_ADMIN_EMAIL:'save-admin@example.test',SAVE_E2E_ADMIN_PASSWORD:'admin-password-123'}
 }
});
