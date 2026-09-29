// Compatibility facade for the legacy roadready domain implementation.
// New Teensurance code should import through this Scout-owned namespace.
import {executeRoadReady,readRoadReady,roadreadyEnabled} from '@/lib/roadready/service';

export const executeScoutLearning=executeRoadReady;
export const readScoutLearning=readRoadReady;
export const scoutLearningEnabled=()=>process.env.SCOUT_LEARNING_ENABLED==='true'||roadreadyEnabled();
