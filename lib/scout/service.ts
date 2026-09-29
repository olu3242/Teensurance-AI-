// Compatibility facade for the legacy roadready domain implementation.
// New Teensurance code should import through this Scout-owned namespace.
export {
  executeRoadReady as executeScoutLearning,
  readRoadReady as readScoutLearning,
  roadreadyEnabled as scoutLearningEnabled,
} from '@/lib/roadready/service';
