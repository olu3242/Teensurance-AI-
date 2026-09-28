export type TimePlanInput = {
  goalHours: number;
  verifiedMinutes: number;
  nightMinutes: number;
  targetNightHours?: number;
  sessionsPerWeek?: number;
  minutesPerSession?: number;
};

export function calculatePracticeTime(input: TimePlanInput) {
  const goalMinutes = Math.max(0, Math.round(input.goalHours * 60));
  const verifiedMinutes = Math.max(0, input.verifiedMinutes);
  const remainingMinutes = Math.max(0, goalMinutes - verifiedMinutes);

  const targetNightMinutes = Math.max(
    0,
    Math.round((input.targetNightHours ?? 0) * 60)
  );

  const remainingNightMinutes = Math.max(
    0,
    targetNightMinutes - Math.max(0, input.nightMinutes)
  );

  const sessionsPerWeek = Math.max(
    1,
    Math.round(input.sessionsPerWeek ?? 2)
  );

  const minutesPerSession = Math.max(
    15,
    Math.round(input.minutesPerSession ?? 45)
  );

  const weeklyMinutes =
    sessionsPerWeek * minutesPerSession;

  const weeksRemaining =
    weeklyMinutes > 0
      ? Math.ceil(remainingMinutes / weeklyMinutes)
      : 0;

  const percent =
    goalMinutes === 0
      ? 100
      : Math.min(
          100,
          Math.round(
            (verifiedMinutes / goalMinutes) * 100
          )
        );

  return {
    goalMinutes,
    verifiedMinutes,
    remainingMinutes,
    remainingNightMinutes,
    sessionsPerWeek,
    minutesPerSession,
    weeklyMinutes,
    weeksRemaining,
    percent
  };
}

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return hours > 0
    ? `${hours}h ${mins.toString().padStart(2, "0")}m`
    : `${mins}m`;
}
