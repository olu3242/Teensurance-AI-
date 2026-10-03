import {scoutLearningEnabled} from '@/lib/scout/service';
import {json} from '@/lib/platform/http';
export const dynamic='force-dynamic';
export function GET(){return json({enabled:scoutLearningEnabled()})}
