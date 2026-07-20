import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import en from "../../../web/src/i18n/messages/en.json" with { type: "json" };
import ru from "../../../web/src/i18n/messages/ru.json" with { type: "json" };
import {
  cheatSheets,
  heistBranches,
  resourceCategories,
  resources,
} from "../../../web/src/containers/Useful/resources.js";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("defines all useful resources with unique IDs", () => {
  assert.equal(resources.length, 16);
  assert.equal(new Set(resources.map(({ id }) => id)).size, resources.length);
});

test("defines the canonical resource names in catalog order", () => {
  assert.deepEqual(
    resources.map(({ name }) => name),
    [
      "Blight Oils Calculator",
      "Chromatic Calculator",
      "Timeless Jewel Viewer",
      "Cluster Jewel Calculator",
      "Craft of Exile",
      "FilterBlade",
      "PoE.re",
      "PoE Planner",
      "TFT Bulk Selling Tool",
      "PoE Trade Extension",
      "Awakened PoE Trade",
      "Wealthy Exile",
      "poe.ninja",
      "PoE-leveling",
      "Merchant Tabs",
      "Current-league map preset",
    ],
  );
});

test("uses HTTPS resource URLs with matching domains", () => {
  for (const resource of resources) {
    const url = new URL(resource.url);

    assert.equal(url.protocol, "https:", resource.id);
    assert.equal(resource.domain, url.hostname, resource.id);
  }
});

test("uses the current-league map preset URL", () => {
  assert.equal(
    resources.find(({ id }) => id === "map-preset")?.url,
    "https://ru.pathofexile.com/trade/search/Mirage/mkJBkBQeT6",
  );
});

test("compact useful layout keeps the important content dense", () => {
  const navbar = readSource("../../../web/src/components/Navbar/index.tsx");
  const navbarStyles = readSource(
    "../../../web/src/components/Navbar/styles.module.css",
  );
  const buildImport = readSource(
    "../../../web/src/components/BuildImportForm/index.tsx",
  );
  const modal = readSource("../../../web/src/components/Modal/index.tsx");
  const useful = readSource("../../../web/src/containers/Useful/index.tsx");
  const styles = readSource(
    "../../../web/src/containers/Useful/styles.module.css",
  );
  const merchantTabs = resources.find(({ id }) => id === "merchant-tabs");
  const enMessages = en as Record<string, string>;
  const ruMessages = ru as Record<string, string>;

  assert.ok(
    navbar.indexOf('t("nav.useful")') < navbar.indexOf('t("nav.build")'),
  );
  assert.doesNotMatch(useful, /jumpNav/);
  assert.doesNotMatch(useful, /styles\.hero/);
  assert.doesNotMatch(styles, /\.resourceCard\s*\{[^}]*min-height:/s);
  assert.match(
    styles,
    /\.heistBranches\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s,
  );
  assert.doesNotMatch(
    styles,
    /@media[^}]+\{[\s\S]*?\.heistBranches\s*\{[^}]*grid-template-columns:\s*1fr/s,
  );
  assert.match(
    styles,
    /\.resourceTitle strong\s*\{[^}]*color:\s*var\(--useful-title\)/s,
  );
  assert.match(
    styles,
    /\.resourceDescription\s*\{[^}]*color:\s*var\(--useful-description\)/s,
  );
  assert.match(modal, /hint\?: string/);
  assert.match(modal, /aria-describedby/);
  assert.match(navbarStyles, /\.navItem\s*\{[^}]*text-align: center/s);
  assert.match(buildImport, /pastebin\\\.com/);
  assert.match(buildImport, /poe\\\.ninja\\\/pob/);
  assert.match(buildImport, /pobb\\\.in/);
  assert.equal(enMessages["nav.useful"], "Useful");
  assert.equal(ruMessages["nav.useful"], "Полезное");
  assert.equal(enMessages["build.pobCode"], "Path of Building code or link");
  assert.equal(ruMessages["build.pobCode"], "Код или ссылка Path of Building");
  assert.match(
    enMessages["build.pobHint"],
    /pobb\.in.*poe\.ninja\/pob.*Pastebin/,
  );
  assert.match(
    ruMessages["build.pobHint"],
    /pobb\.in.*poe\.ninja\/pob.*Pastebin/,
  );
  assert.ok(merchantTabs && !("note" in merchantTabs));
});

test("assigns every resource to exactly one category", () => {
  const categorizedIds = resourceCategories.flatMap(({ resourceIds }) =>
    Array.from(resourceIds),
  );

  assert.equal(categorizedIds.length, resources.length);
  assert.deepEqual(
    [...categorizedIds].sort(),
    resources.map(({ id }) => id).sort(),
  );
});

test("defines the two Heist rogue branches", () => {
  assert.deepEqual(heistBranches, [
    ["tibbs", "tullina", "nenet"],
    ["karst", "huck", "niles", "vinderi", "gianna"],
  ]);
});

test("localizes every Heist rogue name", () => {
  const expectedNames = {
    en: [
      "Tibbs",
      "Tullina",
      "Nenet",
      "Karst",
      "Huck",
      "Niles",
      "Vinderi",
      "Gianna",
    ],
    ru: [
      "Тиббс",
      "Туллина",
      "Ненет",
      "Карст",
      "Хак",
      "Найлс",
      "Виндери",
      "Джианна",
    ],
  };

  for (const [locale, messages] of Object.entries({ en, ru })) {
    const localizedNames = heistBranches
      .flat()
      .map(
        (companion) =>
          (messages as Record<string, string>)[
            `useful.heist.companion.${companion}`
          ],
      );

    assert.deepEqual(localizedNames, expectedNames[locale as "en" | "ru"]);
  }
});

test("defines three cheat sheets with unique filenames", () => {
  assert.equal(cheatSheets.length, 3);
  assert.equal(
    new Set(cheatSheets.map(({ filename }) => filename)).size,
    cheatSheets.length,
  );
});

for (const [locale, messages] of Object.entries({ en, ru })) {
  for (const sheet of cheatSheets) {
    test(`${locale} defines messages for the ${sheet.id} cheat sheet`, () => {
      for (const field of [
        "title",
        "description",
        "alt",
        "attribution",
      ] as const) {
        const key = `useful.sheet.${sheet.id}.${field}`;
        assert.equal(
          typeof (messages as Record<string, unknown>)[key],
          "string",
        );
      }
    });
  }
}
