import {roadreadyEnabled} from '@/lib/roadready/service';
import {json} from '@/lib/platform/http';
export const dynamic='force-dynamic';
export function GET(){return json({enabled:roadreadyEnabled()})}
