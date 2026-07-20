import assert from "node:assert/strict";
import test from "node:test";
import {
  formatMessage,
  normalizeLocale,
  translate,
  translateCatalog,
} from "../../../web/src/i18n/core.js";

test("normalizes supported browser locales", () => {
  assert.equal(normalizeLocale("ru-RU"), "ru");
  assert.equal(normalizeLocale("RU"), "ru");
  assert.equal(normalizeLocale("rU-kZ"), "ru");
  assert.equal(normalizeLocale("en-US"), "en");
});

test("normalizes unsupported and absent locales to English", () => {
  assert.equal(normalizeLocale("broken"), "en");
  assert.equal(normalizeLocale("runtime"), "en");
  assert.equal(normalizeLocale("rubbish"), "en");
  assert.equal(normalizeLocale("ruin"), "en");
  assert.equal(normalizeLocale("ru_foo"), "en");
  assert.equal(normalizeLocale(null), "en");
});

test("formats named message parameters", () => {
  assert.equal(
    formatMessage("Act {act}: {name}", {
      act: 2,
      name: "Лесной лагерь",
    }),
    "Act 2: Лесной лагерь",
  );
});

test("preserves unknown message parameters", () => {
  assert.equal(formatMessage("Act {act}: {name}", { act: 2 }), "Act 2: {name}");
});

test("translates English and Russian messages", () => {
  assert.equal(translate("en", "nav.route"), "Route");
  assert.equal(translate("ru", "nav.route"), "Маршрут");
  assert.equal(translate("en", "fragment.act", { act: 2 }), "Act 2");
  assert.equal(translate("ru", "fragment.act", { act: 2 }), "Акт 2");
  assert.equal(translate("en", "modal.cancel"), "Cancel");
  assert.equal(translate("ru", "modal.submit"), "Отправить");
});

test("falls back to the canonical English message", () => {
  const catalog = {
    en: { "nav.route": "Route" },
    ru: {},
  };

  assert.equal(translateCatalog(catalog, "ru", "nav.route"), "Route");
});
