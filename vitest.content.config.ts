import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['validation/content-review.test.ts'],fileParallelism:false}});
