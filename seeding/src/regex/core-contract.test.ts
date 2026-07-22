import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesSearchExpression,
  parseSearchExpression,
} from "../../../web/src/features/regex/core/search-expression.js";
import { compileBoundedAlternation } from "../../../web/src/features/regex/core/bounded-alternation.js";
import { optimizeSafeCover } from "../../../web/src/features/regex/core/safe-cover.js";
import {
  REGEX_CHARACTER_LIMIT,
  splitRegexIntoTwoPasses,
} from "../../../web/src/features/regex/core/two-pass.js";

test("parses quoted clauses, negation, and escaped quotes", () => {
  assert.deepEqual(
    parseSearchExpression('"maximum resistances" speed "say \\"go\\""'),
    [
      { pattern: "maximum resistances", negated: false },
      { pattern: "speed", negated: false },
      { pattern: 'say \\"go\\"', negated: false },
    ],
  );
  assert.deepEqual(parseSearchExpression('"!reflect|recovery"'), [
    { pattern: "reflect|recovery", negated: true },
  ]);
});

test("matches AND, OR, negation, and fails closed for invalid expressions", () => {
  const text = [
    "Monsters reflect 18% of Elemental Damage",
    "Monsters have 40% increased Attack Speed",
  ].join("\n");

  assert.equal(matchesSearchExpression("reflect speed", text), true);
  assert.equal(matchesSearchExpression('"recovery|attack speed"', text), true);
  assert.equal(matchesSearchExpression('"!reflect|recovery"', text), false);
  assert.equal(matchesSearchExpression('"["', text), false);
  assert.equal(matchesSearchExpression('"unterminated', text), false);
});

test("compiles a stable bounded alternation without dropping terms", () => {
  assert.deepEqual(compileBoundedAlternation(["beta", "alpha", "beta"], 30, true), {
    primary: '"beta|alpha"',
    diagnostics: [],
  });

  const result = compileBoundedAlternation(
    ["один", "два", "три", "четыре"],
    13,
    true,
  );
  assert.ok(result.secondary);
  assert.ok(result.primary.length <= 13);
  assert.ok(result.secondary.length <= 13);
  for (const pattern of ["один", "два", "три", "четыре"]) {
    assert.match(`${result.primary}|${result.secondary}`, new RegExp(pattern));
  }
  assert.deepEqual(result, compileBoundedAlternation(
    ["один", "два", "три", "четыре"],
    13,
    true,
  ));
});

test("reports atomic and two-pass overflow without truncation", () => {
  const atomic = compileBoundedAlternation(["too-long-pattern"], 5, true);
  assert.equal(atomic.primary, '"too-long-pattern"');
  assert.equal(atomic.secondary, undefined);
  assert.match(atomic.error ?? "", /5/);

  const twoPass = compileBoundedAlternation(["aaaa", "bbbb", "cccc"], 6);
  assert.equal(twoPass.primary, "aaaa|bbbb|cccc");
  assert.equal(twoPass.secondary, undefined);
  assert.match(twoPass.error ?? "", /two passes/i);
});

test("uses a 250-character default and stable A/B diagnostics", () => {
  assert.equal(REGEX_CHARACTER_LIMIT, 250);
  const short = splitRegexIntoTwoPasses("speed");
  assert.deepEqual(short, {
    primary: "speed",
    length: 5,
    diagnostics: [],
  });

  const split = splitRegexIntoTwoPasses('"!alpha|beta|gamma"', 13);
  assert.deepEqual(split, {
    primary: '"!alpha|beta"',
    secondary: '"!gamma"',
    composition: "intersection",
    length: 13,
    diagnostics: [
      {
        code: "two-pass-required",
        severity: "info",
        message: "Expression exceeds 13 characters; use passes A and B.",
      },
    ],
  });
  assert.deepEqual(split, splitRegexIntoTwoPasses('"!alpha|beta|gamma"', 13));
});

test("declares union for a split positive alternation", () => {
  const result = splitRegexIntoTwoPasses('"alpha|beta|gamma"', 13);
  assert.equal(result.composition, "union");
  assert.ok(result.secondary);
});

test("declares intersection for negated alternatives and whole AND clauses", () => {
  assert.equal(
    splitRegexIntoTwoPasses('"!alpha|beta|gamma"', 13).composition,
    "intersection",
  );
  assert.equal(
    splitRegexIntoTwoPasses('"alpha|beta" gamma', 13).composition,
    "intersection",
  );
});

test("blocks a mixed split that would change boolean semantics", () => {
  const result = splitRegexIntoTwoPasses('"alpha|beta|gamma" delta', 13);
  assert.equal(result.secondary, undefined);
  assert.equal(result.diagnostics[0]?.code, "unsafe-composition");
});

test("never splits escaped, bracketed, or parenthesized alternatives", () => {
  const parenthesized = splitRegexIntoTwoPasses('"(foo|bar)|baz"', 11);
  assert.equal(parenthesized.primary, '"(foo|bar)"');
  assert.equal(parenthesized.secondary, "baz");

  const bracketed = splitRegexIntoTwoPasses('"[a|b]|charlie"', 9);
  assert.deepEqual(
    new Set([bracketed.primary, bracketed.secondary]),
    new Set(['"[a|b]"', "charlie"]),
  );

  const escaped = splitRegexIntoTwoPasses('"foo\\|bar|baz"', 10);
  assert.deepEqual(
    new Set([escaped.primary, escaped.secondary]),
    new Set(['"foo\\|bar"', "baz"]),
  );
});

test("returns the original expression with blocking diagnostics when unsafe", () => {
  const atomic = splitRegexIntoTwoPasses('"an atomic clause"', 8);
  assert.equal(atomic.primary, '"an atomic clause"');
  assert.equal(atomic.secondary, undefined);
  assert.equal(atomic.diagnostics[0]?.code, "atomic-clause-too-long");
  assert.equal(atomic.diagnostics[0]?.severity, "blocking");

  const overflow = splitRegexIntoTwoPasses('"aaaa|bbbb|cccc"', 6);
  assert.equal(overflow.primary, '"aaaa|bbbb|cccc"');
  assert.equal(overflow.secondary, undefined);
  assert.equal(overflow.diagnostics[0]?.code, "two-pass-overflow");
  assert.equal(overflow.diagnostics[0]?.severity, "blocking");
});

const corpus = [
  { id: 1, pattern: "fire damage", text: "fire damage" },
  { id: 2, pattern: "cold damage", text: "cold damage" },
  { id: 3, pattern: "lightning damage", text: "lightning damage" },
  { id: 4, pattern: "chaos resistance", text: "chaos resistance" },
];

test("chooses an exact collision-free minimum cover deterministically", () => {
  const input = {
    selectedIds: [2, 1, 2],
    corpus,
    candidates: [
      { ids: [1, 2], pattern: "fire|cold" },
      { ids: [1, 2], pattern: "cold|fire" },
      { ids: [1, 2], pattern: "damage" },
      { ids: [1], pattern: "[" },
    ],
  };

  assert.deepEqual(optimizeSafeCover(input), {
    patterns: ["cold|fire"],
    coveredIds: [1, 2],
  });
  assert.deepEqual(optimizeSafeCover(input), optimizeSafeCover(input));
});

test("rejects missing corpus ids and uses a stable greedy path above twenty ids", () => {
  assert.throws(
    () => optimizeSafeCover({ selectedIds: [99], corpus, candidates: [] }),
    /missing corpus item.*99/i,
  );

  const largeCorpus = Array.from({ length: 21 }, (_, index) => ({
    id: index + 1,
    pattern: `item-${String(index + 1).padStart(2, "0")}`,
    text: `item-${String(index + 1).padStart(2, "0")}`,
  }));
  const input = {
    selectedIds: largeCorpus.map(({ id }) => id),
    corpus: largeCorpus,
    candidates: [
      { ids: largeCorpus.slice(0, 10).map(({ id }) => id), pattern: "item-0[1-9]|item-10" },
      { ids: largeCorpus.slice(10).map(({ id }) => id), pattern: "item-(1[1-9]|2[01])" },
    ],
  };

  assert.deepEqual(optimizeSafeCover(input), optimizeSafeCover(input));
  assert.deepEqual(optimizeSafeCover(input).coveredIds, input.selectedIds);
});
