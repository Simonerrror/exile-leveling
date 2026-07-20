import assert from "node:assert/strict";
import test from "node:test";
import {
  assertMessageParity,
  assertRouteParity,
  routeSignature,
} from "./validate.js";

test("message dictionaries require identical keys", () => {
  assert.throws(
    () => assertMessageParity({ route: "Route" }, {}),
    /missing Russian message key: route/,
  );
});

test("route signatures ignore translated prose", () => {
  assert.deepEqual(
    routeSignature("Kill {kill|Hillock} ➞ {enter|1_1_2}"),
    routeSignature("Убей {kill|Хиллок} ➞ {enter|1_1_2}"),
  );
});

test("route signatures preserve structural ids", () => {
  assert.throws(
    () =>
      assertRouteParity("Talk ➞ {enter|1_1_2}", "Иди ➞ {enter|1_1_3}", "act-1"),
    /route structure differs: act-1 line 1/,
  );
});

test("route parity requires the same line count", () => {
  assert.throws(
    () => assertRouteParity("one\ntwo", "один", "act-1"),
    /route line count differs: act-1/,
  );
});
