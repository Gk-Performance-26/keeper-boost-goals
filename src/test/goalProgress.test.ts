import { describe, expect, it } from "vitest";
import { computeGoalProgress, type GoalSession } from "../lib/goalProgress";

const activation = "2026-11-20T14:42:00Z";
const now = new Date("2026-11-22T18:00:00Z");
const session = (completed_at: string, xp_earned = 50, duration_minutes = 20): GoalSession =>
  ({ completed_at, xp_earned, duration_minutes });
const history = [session("2026-11-19T15:00:00Z"), session(activation)];
const after = [session("2026-11-20T15:00:00Z"), session("2026-11-21T15:00:00Z"), session("2026-11-22T15:00:00Z")];

describe("goals count only activity after activation", () => {
  for (const metric_type of ["sessions", "xp", "minutes", "streak"]) {
    it(`${metric_type} starts at zero even with previous activity`, () => {
      expect(computeGoalProgress({ metric_type, period: "all_time" }, history, activation, new Date(activation))).toBe(0);
    });
  }
  it("counts only sessions completed strictly after activation", () => {
    expect(computeGoalProgress({ metric_type: "sessions", period: "all_time" }, [...history, ...after], activation, now)).toBe(3);
  });
  it("counts only XP earned after activation", () => {
    expect(computeGoalProgress({ metric_type: "xp", period: "all_time" }, [...history, ...after], activation, now)).toBe(150);
  });
  it("counts only minutes trained after activation", () => {
    expect(computeGoalProgress({ metric_type: "minutes", period: "all_time" }, [...history, ...after], activation, now)).toBe(60);
  });
  it("starts consecutive training days from post-activation sessions", () => {
    expect(computeGoalProgress({ metric_type: "streak", period: "all_time" }, [...history, ...after], activation, now)).toBe(3);
  });
  it("does not count repeated sessions on a day as extra streak days", () => {
    expect(computeGoalProgress({ metric_type: "streak", period: "all_time" }, [...after, after[2]], activation, now)).toBe(3);
  });
  it("resets the streak after a missed day", () => {
    expect(computeGoalProgress({ metric_type: "streak", period: "all_time" }, [after[0], after[2]], activation, now)).toBe(1);
  });
  it("reactivation ignores activity from the previous activation", () => {
    expect(computeGoalProgress({ metric_type: "sessions", period: "all_time" }, after, now.toISOString(), now)).toBe(0);
  });
  for (const [period, expected] of [["daily", 1], ["weekly", 3], ["monthly", 3]] as const) {
    it(`respects the ${period} window as well as activation`, () => {
      expect(computeGoalProgress({ metric_type: "sessions", period }, [...history, ...after], activation, now)).toBe(expected);
    });
  }
});