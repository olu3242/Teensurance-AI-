import {errorResponse,json,requestUser} from '@/lib/platform/http';
import {requireAdmin} from '@/lib/platform/admin';
import {saveIntegrationHealth} from '@/lib/save/ops';

export const runtime='nodejs';export const dynamic='force-dynamic';

export async function GET(request:Request){
 try{const user=await requestUser(request);requireAdmin(user);return json(await saveIntegrationHealth())}
 catch(error){return errorResponse(error)}
}
