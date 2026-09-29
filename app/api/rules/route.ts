import {texasRule,texasChecklist,learnerSource} from '@/lib/platform/texas';
import {json,requestUser,errorResponse} from '@/lib/platform/http';
import {dashboard} from '@/lib/platform/service';
export const runtime='nodejs';
export async function GET(request:Request){try{const view=(await dashboard((await requestUser(request))));if(view.activeDrive)return json({error:'Review requirements after parking.'},403);return json({rule:texasRule,checklist:texasChecklist,learnerSource,disclaimer:'Reviewed source snapshot; not an eligibility determination.'})}catch(error){return errorResponse(error)}}
