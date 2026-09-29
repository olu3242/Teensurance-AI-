import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['validation/persistence.test.ts'],fileParallelism:false}});
