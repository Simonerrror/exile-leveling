import type { EntriesRegexData } from "./data/types.js";

export interface BeastCatalogEntry {
  id: string;
  label: string;
  recipe?: string;
  red: boolean;
  harvest: boolean;
  searchText: string;
  tradeUrl: string;
  wikiUrl: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const russianRecipeParts: Record<string, string> = {
  "A Stack of 10 Random Currency": "стопка из 10 случайных валют",
  "A Stack of 2 Orbs of Binding": "стопка из 2 сфер связывания",
  "A Stack of 3 Orbs of Unmaking": "стопка из 3 сфер отмены",
  "A Stack of 8 Chromatic Orbs": "стопка из 8 цветных сфер",
  "A valuable Scarab": "ценный скарабей",
  "Add a Mod to a Crusader Item": "добавить модификатор предмету Крестоносца",
  "Add a Prefix, Remove a Random Suffix": "добавить префикс и удалить случайный суффикс",
  "Add a Suffix, Remove a Random Prefix": "добавить суффикс и удалить случайный префикс",
  "Add a crafted Meta-modifier to a non-Unique Item": "добавить созданный метамодификатор неуникальному предмету",
  "Add 500m Experience to an Exceptional Support Gem": "добавить 500 млн опыта исключительному камню поддержки",
  "Body Armour": "нательная броня",
  "Belt": "пояс",
  "Boots": "ботинки",
  "Bow": "лук",
  "Claw or Dagger": "коготь или кинжал",
  "Flask": "флакон",
  "Fully-linked Six-socket Rare": "редкий шестисокетный предмет с полной связью",
  "Gloves": "перчатки",
  "Helmet": "шлем",
  "Level 21 Corrupted Gem": "осквернённый камень 21 уровня",
  "Mace or Sceptre": "булава или скипетр",
  "Map": "карта",
  "Nightmare Map": "карта кошмара",
  "Reroll a Synthesis Implicit Modifier": "перебросить собственный модификатор Синтеза",
  "Reroll a Watcher's Eye": "перебросить модификатор Глаза хранителя",
  "Sacrifice an Exceptional Support Gem for 3 high Level, high Quality Support Gems": "пожертвовать исключительный камень поддержки ради 3 камней поддержки высокого уровня и качества",
  "Shield or Quiver": "щит или колчан",
  "Shaper Guardian, Elder Guardian or Conqueror Map": "карта Хранителя Создателя, Древнего или Завоевателя",
  "Staff": "посох",
  "Sword or Axe": "меч или топор",
  "Synthesis Unique Map": "уникальная карта Синтеза",
  "Talisman": "талисман",
  "Wand": "жезл",
  "23% Quality Corrupted Gem": "осквернённый камень с 23% качества",
};

export function localizeBeastRecipe(recipe: string, locale: "en" | "ru"): string {
  if (locale === "en" || recipe === "") return recipe;
  const [, category = "", detail = ""] = recipe.match(/^(.+?) - (.+)$/) ?? [];
  const translated = russianRecipeParts[detail] ?? detail;
  if (category === "Create a Unique") return `Создать уникальный предмет: ${translated}`;
  if (category === "Create Currency Items") return `Создать валюту: ${translated}`;
  if (category === "Create an Item") return `Создать предмет: ${translated}`;
  if (category === "Create a Rare") return `Создать редкий предмет: ${translated}`;
  if (category === "Modify Mods on an Item") return `Изменить модификаторы: ${translated}`;
  if (category === "Transform an Item") return `Преобразовать предмет: ${translated}`;
  if (category === "Open a Portal") return `Открыть портал: ${detail.replace(/^to /, "")}`;
  if (category === "Corrupt a Map") return "Осквернить карту и добавить собственный модификатор";
  if (category === "Apply a Hinekora's Lock") return "Наложить Замок Хинекоры на магический предмет";
  if (category === "Split an Item") return "Разделить предмет на три предмета с двумя модификаторами на каждом";
  if (category === "Convert this Unique Item") return "Превратить уникальный предмет в другой случайный уникальный предмет";
  if (category === "Craft an Aspect Skill onto an Item") {
    const aspect = detail.match(/Aspect of the (.+?) skill/)?.[1] ?? detail;
    const names: Record<string, string> = { Avian: "Птицы", Cat: "Кошки", Crab: "Краба", Spider: "Паука" };
    return `Добавить предмету умение Аспект ${names[aspect] ?? aspect}`;
  }
  return translated || recipe;
}

export function beastTradeUrl(name: string, league = "Mirage"): string {
  const query = JSON.stringify({ query: { status: { option: "online" }, type: name }, sort: { price: "asc" } });
  return `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(query)}`;
}

export function beastWikiUrl(name: string): string {
  return `https://www.poewiki.net/wiki/${encodeURIComponent(name.replaceAll(" ", "_"))}`;
}

export function bestiaryCatalog(data: EntriesRegexData, locale: "en" | "ru"): BeastCatalogEntry[] {
  const entries = Array.isArray(data.entries) ? data.entries : [];
  return entries.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.beast !== "string") return [];
    const id = candidate.beast;
    const translation = isRecord(data.translations[id]) ? data.translations[id] : {};
    const label = typeof translation.displayName === "string" && translation.displayName
      ? translation.displayName : id;
    const rawRecipe = typeof candidate.recipe === "string" ? candidate.recipe : "";
    const recipe = rawRecipe ? localizeBeastRecipe(rawRecipe, locale) : undefined;
    return [{
      id,
      label,
      recipe,
      red: candidate.red === true,
      harvest: candidate.harvest === true,
      searchText: `${label} ${id} ${recipe ?? ""}`.toLocaleLowerCase(),
      tradeUrl: beastTradeUrl(id),
      wikiUrl: beastWikiUrl(id),
    }];
  }).sort((left, right) => Number(Boolean(right.recipe)) - Number(Boolean(left.recipe)) ||
    left.label.localeCompare(right.label));
}
