import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesSearchExpression,
  parseSearchExpression,
} from "../../../web/src/features/regex/core/search-expression.js";
import { compileBoundedAlternation } from "../../../web/src/features/regex/core/bounded-alternation.js";
import { optimizeSafeCover } from "../../../web/src/features/regex/core/safe-cover.js";

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
