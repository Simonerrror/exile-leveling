export interface LevelingProgressSummary {
  sectionIndex: number;
  stepIndex: number;
  completed: number;
  total: number;
  done: boolean;
}

type RouteLike = readonly {
  steps: readonly { type: string }[];
}[];

export function summarizeLevelingProgress(
  route: RouteLike,
  completedKeys: readonly string[],
): LevelingProgressSummary | null {
  const completed = new Set(completedKeys);
  const fragmentSteps = route.flatMap((section, sectionIndex) =>
    section.steps.flatMap((step, stepIndex) =>
      step.type === "fragment_step" ? [{ sectionIndex, stepIndex }] : [],
    ),
  );
  if (fragmentSteps.length === 0) return null;

  const next = fragmentSteps.find(
    ({ sectionIndex, stepIndex }) =>
      !completed.has(`${sectionIndex},${stepIndex}`),
  );
  const target = next ?? fragmentSteps[fragmentSteps.length - 1];

  return {
    ...target,
    completed: next ? fragmentSteps.indexOf(next) : fragmentSteps.length,
    total: fragmentSteps.length,
    done: next === undefined,
  };
}
