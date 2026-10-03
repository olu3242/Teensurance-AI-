import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
// Legacy compatibility route. Customer-facing navigation uses /teen/scout.
export default function LegacyLearningRoute(){redirect('/teen/scout')}
