export interface BoundedAlternationResult {
  primary: string;
  secondary?: string;
  diagnostics: string[];
  error?: string;
}

function serialize(patterns: string[], quoted: boolean): string {
  if (patterns.length === 0) return "";
  const expression = patterns.join("|");
  return quoted ? `"${expression}"` : expression;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function compileBoundedAlternation(
  rawPatterns: string[],
  maxLength: number,
  quoted = false,
): BoundedAlternationResult {
  if (!Number.isSafeInteger(maxLength) || maxLength < 1) {
    throw new RangeError("maxLength must be a positive safe integer");
  }

  const patterns = Array.from(new Set(rawPatterns.filter(Boolean)));
  const complete = serialize(patterns, quoted);
  if (complete.length <= maxLength) return { primary: complete, diagnostics: [] };

  const oversized = patterns.find(
    (pattern) => serialize([pattern], quoted).length > maxLength,
  );
  if (oversized !== undefined) {
    return {
      primary: complete,
      diagnostics: [],
      error: `An atomic pattern exceeds the ${maxLength} character limit.`,
    };
  }

  const bins: [string[], string[]] = [[], []];
  const sorted = patterns.slice().sort(
    (left, right) => right.length - left.length || compareCodeUnits(left, right),
  );
  for (const pattern of sorted) {
    const target = bins
      .map((bin, index) => ({
        index,
        length: serialize([...bin, pattern], quoted).length,
      }))
      .filter(({ length }) => length <= maxLength)
      .sort((left, right) => left.length - right.length || left.index - right.index)[0];
    if (target === undefined) {
      return {
        primary: complete,
        diagnostics: [],
        error: `The patterns do not fit in two passes of ${maxLength} characters.`,
      };
    }
    bins[target.index].push(pattern);
  }

  return {
    primary: serialize(bins[0], quoted),
    secondary: serialize(bins[1], quoted),
    diagnostics: [`Expression split into two ${maxLength}-character passes.`],
  };
}
