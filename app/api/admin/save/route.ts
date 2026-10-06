import {errorResponse,json,requestUser} from '@/lib/platform/http';
import {saveAdminOperations} from '@/lib/save/admin-ops';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
 try{
  const user=await requestUser(request);
  const householdId=new URL(request.url).searchParams.get('household')||undefined;
  return json(await saveAdminOperations(user,householdId));
 }catch(error){
  return errorResponse(error);
 }
}
