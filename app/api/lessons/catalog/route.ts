import {json} from '@/lib/platform/http';
import {drivingLessons} from '@/lib/driving-lessons';
export function GET(){return json({lessons:drivingLessons})}
