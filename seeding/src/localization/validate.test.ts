import assert from "node:assert/strict";
import test from "node:test";
import {
  assertMessageDictionary,
  assertMessageParity,
  assertRouteParity,
  routeSignature,
} from "./validate.js";

test("message dictionaries require a plain object root", () => {
  assert.throws(
    () => assertMessageDictionary([], "web/src/i18n/messages/ru.json"),
    /invalid message dictionary root: web\/src\/i18n\/messages\/ru.json must be a plain object/,
  );
});

test("message dictionaries require string values", () => {
  assert.throws(
    () =>
      assertMessageDictionary({ route: 42 }, "web/src/i18n/messages/ru.json"),
    /invalid message dictionary value: web\/src\/i18n\/messages\/ru.json key route must be a string/,
  );
});

test("message dictionaries require identical keys", () => {
  assert.throws(
    () => assertMessageParity({ route: "Route" }, {}),
    /missing Russian message key: route/,
  );
});

test("message parity does not count inherited object properties", () => {
  assert.throws(
    () => assertMessageParity({ constructor: "Constructor" }, {}),
    /missing Russian message key: constructor/,
  );
});

test("route signatures ignore translated prose", () => {
  assert.deepEqual(
    routeSignature("Enter {arena|The Warden's Quarters} ➞ {enter|1_1_2}"),
    routeSignature("Войди {arena|Покои надзирателя} ➞ {enter|1_1_2}"),
  );
});

test("route signatures preserve structural ids", () => {
  assert.throws(
    () =>
      assertRouteParity("Talk ➞ {enter|1_1_2}", "Иди ➞ {enter|1_1_3}", "act-1"),
    /route structure differs: act-1 line 1/,
  );
});

test("kill names remain structural because they unlock waypoints", () => {
  assert.throws(
    () => assertRouteParity("Kill {kill|Brutus}", "Убей {kill|Брут}", "act-1"),
    /route structure differs: act-1 line 1/,
  );
});

test("route signatures ignore translated sub-step prose", () => {
  assert.doesNotThrow(() =>
    assertRouteParity(
      "    #sub Find {generic|Loose Candle}",
      "    #sub Найди {generic|Потайную свечу}",
      "act-3",
    ),
  );
});

test("route signatures preserve conditional macros", () => {
  assert.throws(
    () =>
      assertRouteParity("#ifdef LEAGUE_START", "#ifdef RUSSIAN_START", "act-1"),
    /route structure differs: act-1 line 1/,
  );
});

test("route signatures preserve vendor reward costs", () => {
  assert.throws(
    () =>
      assertRouteParity(
        "Buy {reward_vendor|Flame Dash|transmutation}",
        "Купи {reward_vendor|Огненный рывок|alteration}",
        "act-1",
      ),
    /route structure differs: act-1 line 1/,
  );
});

test("route signatures reject invalid display fragment arity", () => {
  assert.throws(
    () => routeSignature("Enter {arena}"),
    /invalid route fragment arity: arena/,
  );
});

test("route parity requires the same line count", () => {
  assert.throws(
    () => assertRouteParity("one\ntwo", "один", "act-1"),
    /route line count differs: act-1/,
  );
});
