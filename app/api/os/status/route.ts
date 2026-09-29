import {json} from '@/lib/platform/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(){return json({error:'Global operations feed retired. Use your authenticated workspace.'},410)}
