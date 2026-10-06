export type TeenWidget =
  | "next_step"
  | "time"
  | "passport"
  | "recent_drives"
  | "safety";

export type ParentWidget =
  | "review_queue"
  | "time"
  | "family_progress"
  | "safety"
  | "coverage"
  | "savings";

export type AdminWidget =
  | "operations"
  | "workflows"
  | "events"
  | "reviews"
  | "system";

export type DashboardPreferences = {
  teen: TeenWidget[];
  parent: ParentWidget[];
  admin: AdminWidget[];
  targetNightHours: number;
  sessionsPerWeek: number;
  minutesPerSession: number;
};

export const defaultDashboardPreferences: DashboardPreferences = {
  teen: [
    "next_step",
    "time",
    "passport",
    "recent_drives",
    "safety"
  ],

  parent: [
    "review_queue",
    "time",
    "family_progress",
    "safety",
    "coverage",
    "savings"
  ],

  admin: [
    "system",
    "operations",
    "workflows",
    "reviews",
    "events"
  ],

  targetNightHours: 0,
  sessionsPerWeek: 2,
  minutesPerSession: 45
};
