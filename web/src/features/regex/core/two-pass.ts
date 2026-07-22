import { parseSearchExpression } from "./search-expression.js";
import type { RegexCompileResult, RegexDiagnostic } from "./types.js";

export const REGEX_CHARACTER_LIMIT = 250;

interface AtomicClause {
  clauseIndex: number;
  negated: boolean;
  pattern: string;
}

interface SplitUnit {
  atoms: AtomicClause[];
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function splitTopLevelAlternatives(pattern: string): string[] {
  const alternatives: string[] = [];
  let current = "";
  let escaped = false;
  let parentheses = 0;
  let brackets = 0;

  for (const character of pattern) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\") {
      current += character;
      escaped = true;
      continue;
    }
    if (character === "(") parentheses += 1;
    if (character === ")") parentheses = Math.max(0, parentheses - 1);
    if (character === "[") brackets += 1;
    if (character === "]") brackets = Math.max(0, brackets - 1);
    if (character === "|" && parentheses === 0 && brackets === 0) {
      alternatives.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  alternatives.push(current);
  return alternatives;
}

function serializeAtoms(atoms: AtomicClause[]): string {
  const clauseIndexes = Array.from(
    new Set(atoms.map(({ clauseIndex }) => clauseIndex)),
  ).sort((left, right) => left - right);

  return clauseIndexes
    .map((clauseIndex) => {
      const clauseAtoms = atoms.filter((atom) => atom.clauseIndex === clauseIndex);
      const pattern = clauseAtoms
        .map((atom) => atom.pattern)
        .sort(compareCodeUnits)
        .join("|");
      const negated = clauseAtoms[0]?.negated === true;
      const value = `${negated ? "!" : ""}${pattern}`;
      return negated || /\s|\|/.test(pattern) ? `"${value}"` : value;
    })
    .join(" ");
}

function blocking(
  code: RegexDiagnostic["code"],
  message: string,
): RegexDiagnostic[] {
  return [{ code, severity: "blocking", message }];
}

export function splitRegexIntoTwoPasses(
  expression: string,
  maxLength = REGEX_CHARACTER_LIMIT,
): RegexCompileResult {
  if (!Number.isSafeInteger(maxLength) || maxLength < 1) {
    throw new RangeError("maxLength must be a positive safe integer");
  }
  if (expression.length <= maxLength) {
    return { primary: expression, length: expression.length, diagnostics: [] };
  }

  const clauses = parseSearchExpression(expression);
  if (clauses.length === 0) {
    return {
      primary: expression,
      length: expression.length,
      diagnostics: blocking("invalid-expression", "Expression has no searchable clauses."),
    };
  }
  for (const clause of clauses) {
    try {
      new RegExp(clause.pattern, "i");
    } catch {
      return {
        primary: expression,
        length: expression.length,
        diagnostics: blocking("invalid-expression", "Expression contains an invalid regular expression."),
      };
    }
  }

  const clauseAtoms = clauses.map((clause, clauseIndex) =>
    splitTopLevelAlternatives(clause.pattern).map((pattern) => ({
      clauseIndex,
      negated: clause.negated,
      pattern,
    })),
  );
  const oneClause = clauses.length === 1;
  const composition = oneClause && clauses[0]?.negated !== true ? "union" : "intersection";
  const units: SplitUnit[] = oneClause
    ? (clauseAtoms[0] ?? []).map((atom) => ({ atoms: [atom] }))
    : clauseAtoms.flatMap((atoms, clauseIndex) => {
      if (clauses[clauseIndex]?.negated === true) {
        return atoms.map((atom) => ({ atoms: [atom] }));
      }
      return [{ atoms }];
    });
  const oversized = units.find((unit) => serializeAtoms(unit.atoms).length > maxLength);
  if (oversized !== undefined) {
    const positiveAlternation = oversized.atoms.length > 1 && oversized.atoms[0]?.negated !== true;
    return {
      primary: expression,
      length: expression.length,
      diagnostics: blocking(
        positiveAlternation ? "unsafe-composition" : "atomic-clause-too-long",
        positiveAlternation
          ? "Expression mixes AND with an oversized OR clause and cannot be split without changing its meaning."
          : `An atomic clause exceeds the ${maxLength} character limit and cannot be split safely.`,
      ),
    };
  }

  const bins: [AtomicClause[], AtomicClause[]] = [[], []];
  const sortedUnits = units.slice().sort((left, right) => {
    const lengthDifference = serializeAtoms(right.atoms).length - serializeAtoms(left.atoms).length;
    if (lengthDifference !== 0) return lengthDifference;
    const leftAtom = left.atoms[0];
    const rightAtom = right.atoms[0];
    if (leftAtom?.clauseIndex !== rightAtom?.clauseIndex) {
      return (leftAtom?.clauseIndex ?? 0) - (rightAtom?.clauseIndex ?? 0);
    }
    return compareCodeUnits(leftAtom?.pattern ?? "", rightAtom?.pattern ?? "");
  });

  for (const unit of sortedUnits) {
    const target = bins
      .map((bin, index) => ({
        index,
        length: serializeAtoms([...bin, ...unit.atoms]).length,
      }))
      .filter(({ length }) => length <= maxLength)
      .sort((left, right) => left.length - right.length || left.index - right.index)[0];
    if (target === undefined) {
      return {
        primary: expression,
        length: expression.length,
        diagnostics: blocking(
          "two-pass-overflow",
          `Expression cannot fit in two passes of ${maxLength} characters.`,
        ),
      };
    }
    bins[target.index].push(...unit.atoms);
  }

  const primary = serializeAtoms(bins[0]);
  const secondary = serializeAtoms(bins[1]);
  if (secondary.length === 0) {
    return {
      primary: expression,
      length: expression.length,
      diagnostics: blocking(
        "two-pass-overflow",
        `Expression cannot fit in two passes of ${maxLength} characters.`,
      ),
    };
  }

  return {
    primary,
    secondary,
    composition,
    length: primary.length,
    diagnostics: [
      {
        code: "two-pass-required",
        severity: "info",
        message: `Expression exceeds ${maxLength} characters; use passes A and B.`,
      },
    ],
  };
}
