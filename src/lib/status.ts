import { STEP_COUNT } from "./steps";

export type ReleaseStatus = "planned" | "ongoing" | "done";

export function computeStatus(completedStepIds: number[]): ReleaseStatus {
  const unique = new Set(
    completedStepIds.filter(
      (n) => Number.isInteger(n) && n >= 0 && n < STEP_COUNT,
    ),
  );
  const done = unique.size;
  if (done === 0) return "planned";
  if (done === STEP_COUNT) return "done";
  return "ongoing";
}
