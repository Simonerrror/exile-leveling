export interface SafeCoverCorpusItem {
  id: number;
  pattern: string;
  text: string;
}

export interface SafeCoverCandidate {
  ids: number[];
  pattern: string;
}

export interface SafeCoverInput {
  selectedIds: number[];
  corpus: SafeCoverCorpusItem[];
  candidates: SafeCoverCandidate[];
}

export interface SafeCoverResult {
  patterns: string[];
  coveredIds: number[];
}

interface CoverOption {
  ids: number[];
  pattern: string;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isExactCoverOption(option: CoverOption, corpus: SafeCoverCorpusItem[]): boolean {
  let regex: RegExp;
  try {
    regex = new RegExp(option.pattern, "i");
  } catch {
    return false;
  }
  const expectedIds = new Set(option.ids);
  const matchedIds = new Set(
    corpus.filter((item) => regex.test(item.text)).map((item) => item.id),
  );
  return matchedIds.size === expectedIds.size &&
    Array.from(expectedIds).every((id) => matchedIds.has(id));
}

function optionSavings(
  option: CoverOption,
  corpusById: Map<number, SafeCoverCorpusItem>,
): number {
  const unoptimizedLength = option.ids.reduce(
    (length, id) => length + (corpusById.get(id)?.pattern.length ?? 0),
    Math.max(0, option.ids.length - 1),
  );
  return unoptimizedLength - option.pattern.length;
}

function compareGreedyOptions(
  left: CoverOption,
  right: CoverOption,
  corpusById: Map<number, SafeCoverCorpusItem>,
): number {
  const savings = optionSavings(right, corpusById) - optionSavings(left, corpusById);
  if (savings !== 0) return savings;
  if (left.ids.length !== right.ids.length) return right.ids.length - left.ids.length;
  if (left.pattern.length !== right.pattern.length) return left.pattern.length - right.pattern.length;
  return compareCodeUnits(left.pattern, right.pattern);
}

function compareCovers(left: string[], right: string[]): number {
  const leftExpression = left.join("|");
  const rightExpression = right.join("|");
  if (leftExpression.length !== rightExpression.length) {
    return leftExpression.length - rightExpression.length;
  }
  if (left.length !== right.length) return left.length - right.length;
  return compareCodeUnits(leftExpression, rightExpression);
}

export function optimizeSafeCover(input: SafeCoverInput): SafeCoverResult {
  const selectedIds = Array.from(new Set(input.selectedIds)).sort((left, right) => left - right);
  if (selectedIds.length === 0) return { patterns: [], coveredIds: [] };

  const corpusById = new Map(input.corpus.map((item) => [item.id, item]));
  const selectedSet = new Set(selectedIds);
  const individualOptions = selectedIds.map((id) => {
    const item = corpusById.get(id);
    if (item === undefined) throw new Error(`Missing corpus item for selected id ${id}`);
    return { ids: [id], pattern: item.pattern };
  });
  const candidateOptions = input.candidates
    .map((candidate) => ({
      ids: Array.from(new Set(candidate.ids)).sort((left, right) => left - right),
      pattern: candidate.pattern,
    }))
    .filter((candidate) => candidate.ids.length > 0)
    .filter((candidate) => candidate.ids.every((id) => selectedSet.has(id)));
  const options = [...individualOptions, ...candidateOptions].filter((option) =>
    isExactCoverOption(option, input.corpus),
  );

  function solveGreedy(): string[] | null {
    const remaining = new Set(selectedIds);
    const result: string[] = [];
    while (remaining.size > 0) {
      const firstId = Array.from(remaining).sort((left, right) => left - right)[0];
      const best = options
        .filter((option) => option.ids.includes(firstId))
        .filter((option) => option.ids.every((id) => remaining.has(id)))
        .sort((left, right) => compareGreedyOptions(left, right, corpusById))[0];
      if (best === undefined) return null;
      result.push(best.pattern);
      best.ids.forEach((id) => remaining.delete(id));
    }
    return result.sort(compareCodeUnits);
  }

  const memo = new Map<string, string[] | null>();
  function solve(remainingIds: number[]): string[] | null {
    if (remainingIds.length === 0) return [];
    const key = remainingIds.join(":");
    if (memo.has(key)) return memo.get(key) ?? null;

    const remaining = new Set(remainingIds);
    const firstId = remainingIds[0];
    let best: string[] | null = null;
    for (const option of options) {
      if (!option.ids.includes(firstId) || !option.ids.every((id) => remaining.has(id))) continue;
      const tail = solve(remainingIds.filter((id) => !option.ids.includes(id)));
      if (tail === null) continue;
      const proposal = [option.pattern, ...tail].sort(compareCodeUnits);
      if (best === null || compareCovers(proposal, best) < 0) best = proposal;
    }
    memo.set(key, best);
    return best;
  }

  const patterns = selectedIds.length <= 20 ? solve(selectedIds) : solveGreedy();
  if (patterns === null) {
    throw new Error(`No safe cover for selected ids: ${selectedIds.join(", ")}`);
  }
  return { patterns, coveredIds: selectedIds };
}
