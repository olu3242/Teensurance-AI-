import {defineConfig} from 'vitest/config';
import {resolve} from 'node:path';
export default defineConfig({resolve:{alias:{'@':resolve(__dirname)}},test:{include:['lib/platform/operations.test.ts','lib/pilot/service.test.ts','lib/platform/service.test.ts','lib/platform/persistence-parity.test.ts','lib/platform/legacy-security.test.ts','validation/save-persistence.test.ts','lib/roadready/roadready.test.ts','lib/roadready/intelligence.test.ts','lib/roadready/review.test.ts','app/api/**/*.test.ts'],setupFiles:['validation/postgres-setup.ts'],fileParallelism:false,testTimeout:15000}});
