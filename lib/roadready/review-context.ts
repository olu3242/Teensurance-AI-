import {AsyncLocalStorage} from 'node:async_hooks';
export const contentVisibility=new AsyncLocalStorage<Set<string>>();
export function requiresHumanReview(){return !!process.env.VERCEL||process.env.TEENSURANCE_ENV==='production'||process.env.ROADREADY_REQUIRE_HUMAN_REVIEW==='true'}
