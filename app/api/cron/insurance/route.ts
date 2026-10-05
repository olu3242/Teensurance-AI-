import {AppError} from '@/lib/platform/auth';
import {errorResponse,json} from '@/lib/platform/http';
import {executeDueInsuranceTriggers} from '@/lib/insurance/scheduler';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try{
    const expected=process.env.CRON_SECRET;
    if(!expected)throw new AppError('Insurance scheduler is not configured.',503);
    const supplied=request.headers.get('authorization');
    if(supplied!==`Bearer ${expected}`)throw new AppError('Unauthorized.',401);
    const results=await executeDueInsuranceTriggers();
    return json({ok:true,processed:results.length,results});
  }catch(error){return errorResponse(error)}
}
