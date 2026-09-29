import {body,errorResponse,json,requestUser,sameOrigin} from '@/lib/platform/http';
import {readLegacyLearning,writeLegacyLearning} from '@/lib/platform/legacy-learning';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{const result=(await readLegacyLearning((await requestUser(request)),Object.fromEntries(new URL(request.url).searchParams)));return json({attempts:result.state.lessonAttempts,householdId:result.householdId,teenId:result.teenId})}catch(error){return errorResponse(error)}}
export async function POST(request:Request){try{const user=(await requestUser(request));sameOrigin(request);return json((await writeLegacyLearning(user,await body(request))))}catch(error){return errorResponse(error)}}
