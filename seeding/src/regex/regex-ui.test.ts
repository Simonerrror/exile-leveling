import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import en from "../../../web/src/i18n/messages/en.json" with { type: "json" };
import ru from "../../../web/src/i18n/messages/ru.json" with { type: "json" };

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const toolIds = [
  "vendor", "maps", "items", "mapnames", "expedition", "heist",
  "flasks", "beast", "tattoo", "runegraft", "scarabs", "jewels",
];

test("routes the catalog and twelve stable regex workspaces lazily", () => {
  const routes = read("../../../web/src/containers/index.tsx");
  assert.match(routes, /lazy\(\(\) => import\("\.\/RegexWorkspace"\)\)/);
  assert.match(routes, /path="\/regex\/:toolId"/);
  assert.match(routes, /RegexWorkspace/);

  const catalog = read("../../../web/src/containers/RegexCatalog/index.tsx");
  for (const id of toolIds) assert.match(catalog, new RegExp(`to=\\{?\`?/regex/.*${id}|${id}`));
  assert.match(catalog, /<Link/);
  assert.match(catalog, /requestIdleCallback/);
  assert.match(catalog, /loadRegexData\("mapnames", locale\)/);
  assert.doesNotMatch(catalog, /upcoming/);
});

test("workspace loads route-level data and exposes accessible A/B output", () => {
  const workspace = read("../../../web/src/containers/RegexWorkspace/index.tsx");
  assert.match(workspace, /loadRegexData/);
  assert.match(workspace, /loaded\.tool === tool/);
  assert.match(workspace, /loaded\.locale === locale/);
  assert.match(workspace, /compileVendorRegex/);
  assert.match(workspace, /compileMapRegex/);
  assert.match(workspace, /aria-live="polite"/);
  assert.match(workspace, /navigator\.clipboard\.writeText/);
  assert.match(workspace, /loadProfileStore/);
  assert.match(workspace, /saveProfileStore/);
  assert.match(workspace, /vendorGroups/);
  assert.match(workspace, /movement/);
  assert.match(workspace, /plusGems/);
  assert.match(workspace, /damage/);
  assert.match(workspace, /weapon/);
  assert.match(workspace, /linkCounts/);
  assert.match(workspace, /\[2, 3, 4, 5, 6\]/);
  assert.match(workspace, /t\(labelKey\)/);
  assert.match(workspace, /displayDescription/);
  assert.match(workspace, /selectedPrefix/);
  assert.match(workspace, /selectedSuffix/);
  assert.match(workspace, /ignoreEffectTiers/);
  for (const forbidden of [
    "ColorLink", "SixSocket", "specLink", "socket color",
  ]) assert.equal(workspace.includes(forbidden), false, forbidden);
});

test("regex UI messages have exact EN/RU parity and no migration placeholder", () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ru).sort());
  assert.equal(ru["regex.tool.runegraft"], "Рунограммы");
  assert.doesNotMatch(JSON.stringify(ru), /рунн(?:ые|ая|ых)? привив/i);
  for (const messages of [en, ru]) {
    for (const key of [
      "regex.catalog.description", "regex.workspace.search", "regex.workspace.copyA",
      "regex.workspace.copyB", "regex.workspace.empty", "regex.workspace.links",
      "regex.workspace.vendor.movement", "regex.workspace.vendor.plusGems",
      "regex.workspace.vendor.damage", "regex.workspace.vendor.weapon",
      "regex.workspace.flasks.itemLevel", "regex.workspace.flasks.prefix",
      "regex.workspace.flasks.suffix", "regex.workspace.flasks.requireBoth",
      "regex.workspace.flasks.openAffix", "regex.workspace.flasks.ignoreEffectTier",
      "regex.workspace.flasks.highestPrefix", "regex.workspace.flasks.highestSuffix",
      "regex.workspace.vendor.color.r", "regex.workspace.vendor.color.g",
      "regex.workspace.vendor.color.b", "regex.workspace.vendor.color.w",
      "regex.workspace.vendor.active", "regex.workspace.vendor.support",
      "regex.workspace.vendor.requiredLevel",
    ]) assert.equal(typeof messages[key as keyof typeof messages], "string", key);
    assert.doesNotMatch(messages["regex.catalog.description"], /moving|переезжа/i);
  }
  assert.deepEqual(
    {
      any: ru["regex.workspace.vendor.option.any"],
      fire: ru["regex.workspace.vendor.option.fire"],
      cold: ru["regex.workspace.vendor.option.cold"],
      lightning: ru["regex.workspace.vendor.option.lightning"],
      physical: ru["regex.workspace.vendor.option.physical"],
      chaos: ru["regex.workspace.vendor.option.chaos"],
      sceptre: ru["regex.workspace.vendor.weapon.sceptre"],
      mace: ru["regex.workspace.vendor.weapon.mace"],
      axe: ru["regex.workspace.vendor.weapon.axe"],
      sword: ru["regex.workspace.vendor.weapon.sword"],
      bow: ru["regex.workspace.vendor.weapon.bow"],
      claw: ru["regex.workspace.vendor.weapon.claw"],
      dagger: ru["regex.workspace.vendor.weapon.dagger"],
      staff: ru["regex.workspace.vendor.weapon.staff"],
      wand: ru["regex.workspace.vendor.weapon.wand"],
      shield: ru["regex.workspace.vendor.weapon.shield"],
    },
    {
      any: "Любой",
      fire: "Огонь",
      cold: "Холод",
      lightning: "Молния",
      physical: "Физический",
      chaos: "Хаос",
      sceptre: "Скипетр",
      mace: "Булава",
      axe: "Топор",
      sword: "Меч",
      bow: "Лук",
      claw: "Коготь",
      dagger: "Кинжал",
      staff: "Посох",
      wand: "Жезл",
      shield: "Щит",
    },
  );
});

test("workspace layout has visible focus, compact top output, and mobile fallback", () => {
  const styles = read("../../../web/src/containers/RegexWorkspace/styles.module.css");
  assert.doesNotMatch(styles, /position:\s*sticky/);
  assert.match(styles, /\.output\s*\{[^}]*grid-row:\s*1/s);
  assert.match(styles, /height:\s*2\.6rem/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media\s*\(max-width:\s*54rem\)/);
  assert.match(styles, /grid-template-columns:\s*1fr/);
  assert.doesNotMatch(styles, /min-width:\s*[4-9]\d\dpx/);
});
