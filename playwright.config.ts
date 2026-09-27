import {defineConfig,devices} from '@playwright/test';
import {resolve} from 'node:path';
export default defineConfig({testDir:'./e2e',fullyParallel:false,workers:1,timeout:180000,expect:{timeout:20000},use:{baseURL:'http://127.0.0.1:3100',trace:'retain-on-failure',...devices['Desktop Chrome']},reporter:[['list'],['html',{open:'never'}]],webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port 3100',url:'http://127.0.0.1:3100',reuseExistingServer:false,timeout:120000,env:{NEXT_DIST_DIR:'.next-cert',TEENSURANCE_DB_PATH:resolve(`test-results/certification-${Date.now()}.sqlite`)}}});
