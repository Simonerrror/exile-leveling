export interface SearchClause {
  pattern: string;
  negated: boolean;
}

interface TokenizedExpression {
  clauses: SearchClause[];
  balancedQuotes: boolean;
}

function tokenizeSearchExpression(expression: string): TokenizedExpression {
  const rawClauses: string[] = [];
  let current = "";
  let quoted = false;
  let escaped = false;

  for (const character of expression.trim()) {
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
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (/\s/.test(character) && !quoted) {
      if (current.length > 0) {
        rawClauses.push(current);
        current = "";
      }
      continue;
    }
    current += character;
  }

  if (current.length > 0) rawClauses.push(current);
  return {
    balancedQuotes: !quoted,
    clauses: rawClauses.map((clause) => ({
      pattern: clause.startsWith("!") ? clause.slice(1) : clause,
      negated: clause.startsWith("!"),
    })),
  };
}

export function parseSearchExpression(expression: string): SearchClause[] {
  return tokenizeSearchExpression(expression).clauses;
}

export function matchesSearchExpression(expression: string, text: string): boolean {
  const tokenized = tokenizeSearchExpression(expression);
  if (!tokenized.balancedQuotes) return false;

  return tokenized.clauses.every((clause) => {
    try {
      const matches = new RegExp(clause.pattern, "i").test(text);
      return clause.negated ? !matches : matches;
    } catch {
      return false;
    }
  });
}
