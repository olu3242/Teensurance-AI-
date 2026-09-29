"use client";

import {
  useMemo,
  useState
} from "react";

import {
  calculatePracticeTime,
  formatMinutes
} from "@/lib/time-calculator";

type Props = {
  verifiedMinutes: number;
  nightMinutes: number;
  goalHours: number;
  onGoalChange?: (hours: number) => void;
};

export function TimeCalculator({
  verifiedMinutes,
  nightMinutes,
  goalHours: initialGoal,
  onGoalChange
}: Props) {
  const [goalHours, setGoalHours] =
    useState(initialGoal);

  const [targetNightHours, setTargetNightHours] =
    useState(0);

  const [sessionsPerWeek, setSessionsPerWeek] =
    useState(2);

  const [minutesPerSession, setMinutesPerSession] =
    useState(45);

  const plan = useMemo(
    () =>
      calculatePracticeTime({
        goalHours,
        verifiedMinutes,
        nightMinutes,
        targetNightHours,
        sessionsPerWeek,
        minutesPerSession
      }),
    [
      goalHours,
      verifiedMinutes,
      nightMinutes,
      targetNightHours,
      sessionsPerWeek,
      minutesPerSession
    ]
  );

  return (
    <section className="dashCard timeCalc">
      <div className="dashCardHead">
        <div>
          <span>MILES / TIME CALCULATOR</span>

          <h2>
            Plan the practice.
            Not the pressure.
          </h2>
        </div>

        <strong>{plan.percent}%</strong>
      </div>

      <div className="timeStats">
        <div>
          <span>Verified</span>
          <strong>
            {formatMinutes(plan.verifiedMinutes)}
          </strong>
        </div>

        <div>
          <span>Remaining</span>
          <strong>
            {formatMinutes(plan.remainingMinutes)}
          </strong>
        </div>

        <div>
          <span>Est. weeks</span>
          <strong>{plan.weeksRemaining}</strong>
        </div>
      </div>

      <div className="timeInputs">
        <label>
          Family goal (hours)

          <input
            type="number"
            min="1"
            max="200"
            value={goalHours}
            onChange={(event) => {
              const value = Math.max(
                1,
                Number(event.target.value)
              );

              setGoalHours(value);
              onGoalChange?.(value);
            }}
          />
        </label>

        <label>
          Target night hours

          <input
            type="number"
            min="0"
            max="100"
            value={targetNightHours}
            onChange={(event) =>
              setTargetNightHours(
                Math.max(
                  0,
                  Number(event.target.value)
                )
              )
            }
          />
        </label>

        <label>
          Sessions / week

          <input
            type="number"
            min="1"
            max="7"
            value={sessionsPerWeek}
            onChange={(event) =>
              setSessionsPerWeek(
                Math.max(
                  1,
                  Number(event.target.value)
                )
              )
            }
          />
        </label>

        <label>
          Minutes / session

          <input
            type="number"
            min="15"
            max="240"
            step="5"
            value={minutesPerSession}
            onChange={(event) =>
              setMinutesPerSession(
                Math.max(
                  15,
                  Number(event.target.value)
                )
              )
            }
          />
        </label>
      </div>

      <div className="sourceNotice">
        This calculator uses your family practice goal.
        It does not represent a legal minimum unless a
        verified jurisdiction requirement explicitly
        says so.
      </div>
    </section>
  );
}
