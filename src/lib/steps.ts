/** Same steps for every release; IDs are stable array indices. */
export const RELEASE_STEPS: readonly string[] = [
  "All relevant GitHub pull requests have been merged",
  "CHANGELOG.md files have been updated",
  "All tests are passing",
  "Releases in GitHub created",
  "Deployed in demo",
  "Tested thoroughly in demo",
  "Deployed in production",
  "Documentation and runbooks updated",
] as const;

export const STEP_COUNT = RELEASE_STEPS.length;

export function isValidStepId(id: number): boolean {
  return Number.isInteger(id) && id >= 0 && id < STEP_COUNT;
}
