import { useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { Link, Navigate, useParams } from "react-router-dom";
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n/core";
import { loadRegexData } from "../../features/regex/data/loaders";
import type {
  EntriesRegexData,
  ExpeditionRegexData,
  FlaskRegexData,
  HeistRegexData,
  ItemRegexData,
  JewelRegexData,
  MapRegexData,
  PricedEntriesRegexData,
  RegexDataByTool,
  RegexDataToolId,
  VendorRegexData,
} from "../../features/regex/data/types";
import { compileVendorRegex } from "../../features/regex/core/vendor";
import { compileMapRegex, createDefaultMapSettings } from "../../features/regex/core/maps";
import {
  compileExpeditionRegex,
  compileHeistRegex,
  compileJewelRegex,
  compilePricedBeastRegex,
  compilePricedTattooRegex,
  compileRunegraftRegex,
  compileScarabRegex,
  type PricedBeastEntry,
  type PricedTattooEntry,
} from "../../features/regex/core/content";
import { compileFlaskRegex } from "../../features/regex/core/flasks";
import { compileItemRegex } from "../../features/regex/core/items";
import {
  itemCompileInput,
  itemBaseOptions,
  itemModCatalog,
  jewelOptions,
  normalizeBeastEditorSettings,
  normalizeItemEditorSettings,
  normalizeJewelEditorSettings,
  normalizeMapEditorSettings,
  normalizeValueFilterSettings,
  selectedWithinValueFilter,
  valueFilterMatches,
  type BeastEditorSettings,
  type ItemEditorSettings,
  type JewelEditorSettings,
  type ValueFilterSettings,
} from "../../features/regex/editors/compile-input";
import type { MapRegexSettings } from "../../features/regex/core/maps";
import {
  groupVendorGems,
  matchBuildGems,
  type BuildGemMatch,
} from "../../features/regex/vendor-gem-catalog";
import { requiredGemsSelector } from "../../state/gem";
import { heistContractLabels } from "../../features/regex/heist-contract-labels";
import { bestiaryCatalog } from "../../features/regex/bestiary-catalog";
import {
  heistCompileInput,
  normalizeHeistSettings,
  type HeistProfileSettings,
} from "../../features/regex/heist-settings";
import {
  defaultExpeditionSettings,
  expeditionCatalog,
  formatChaosValue,
  normalizeExpeditionSettings,
  visibleExpeditionOutcomes,
  valuableExpeditionFillers,
  type ExpeditionSettings,
} from "../../features/regex/expedition-catalog";
import {
  createDefaultToolSettings,
  normalizeFlaskSettings,
  normalizeVendorSettings,
  type FlaskProfileSettings,
  type JsonObject,
  type LinkCount,
  type RegexProfileStore,
  type RegexToolProfileSettings,
  type VendorProfileSettings,
} from "../../features/regex/profile/schema";
import { loadProfileStore, saveProfileStore } from "../../features/regex/profile/storage";
import type { RegexCompileResult } from "../../features/regex/core/types";
import {
  EntityImage,
  regexEditorToolIds,
  type RegexEditorToolId,
} from "../../features/regex/editors";
import styles from "./styles.module.css";
import beastIcon from "../RegexCatalog/images/regex-tool-beast.png";
import heistIcon from "../RegexCatalog/images/regex-tool-heist.png";
import tattooIcon from "../RegexCatalog/images/regex-tool-tattoo.png";

type ToolId = RegexEditorToolId;

const dataToolByRoute: Record<ToolId, RegexDataToolId> = {
  vendor: "vendor", maps: "maps", items: "items",
  expedition: "expedition", heist: "heist", flasks: "flasks", beast: "beast",
  tattoo: "tattoos", runegraft: "runegrafts", scarabs: "scarabs", jewels: "jewels",
};

const profileToolByRoute: Record<ToolId, keyof RegexToolProfileSettings> = {
  vendor: "vendor", maps: "maps", items: "items",
  expedition: "expedition", heist: "heist", flasks: "flasks", beast: "beast",
  tattoo: "tattoos", runegraft: "runegrafts", scarabs: "scarabs", jewels: "jewels",
};

type VendorBooleanGroup = "movement" | "plusGems" | "damage" | "weapon";
const vendorGroups = [
  { key: "movement", title: "regex.workspace.vendor.movement", options: [["ten", "regex.workspace.vendor.option.ten"], ["fifteen", "regex.workspace.vendor.option.fifteen"]] },
  { key: "plusGems", title: "regex.workspace.vendor.plusGems", options: [["any", "regex.workspace.vendor.option.any"], ["fire", "regex.workspace.vendor.option.fire"], ["cold", "regex.workspace.vendor.option.cold"], ["lightning", "regex.workspace.vendor.option.lightning"], ["phys", "regex.workspace.vendor.option.physical"], ["chaos", "regex.workspace.vendor.option.chaos"]] },
  { key: "damage", title: "regex.workspace.vendor.damage", options: [["phys", "regex.workspace.vendor.option.physical"], ["firemult", "regex.workspace.vendor.option.fire"], ["coldmult", "regex.workspace.vendor.option.cold"], ["chaosmult", "regex.workspace.vendor.option.chaos"]] },
  { key: "weapon", title: "regex.workspace.vendor.weapon", options: [["sceptre", "regex.workspace.vendor.weapon.sceptre"], ["mace", "regex.workspace.vendor.weapon.mace"], ["axe", "regex.workspace.vendor.weapon.axe"], ["sword", "regex.workspace.vendor.weapon.sword"], ["bow", "regex.workspace.vendor.weapon.bow"], ["claw", "regex.workspace.vendor.weapon.claw"], ["dagger", "regex.workspace.vendor.weapon.dagger"], ["staff", "regex.workspace.vendor.weapon.staff"], ["wand", "regex.workspace.vendor.weapon.wand"], ["shield", "regex.workspace.vendor.weapon.shield"]] },
] as const;

interface Option {
  chaosValue?: number;
  id: string;
  icon?: string;
  label: string;
  secondaryLabel?: string;
  pattern?: string;
  affix?: "prefix" | "suffix";
}
interface LoadedData {
  tool: ToolId;
  locale: "en" | "ru";
  value: RegexDataByTool[RegexDataToolId];
}
const emptyResult: RegexCompileResult = { primary: "", length: 0, diagnostics: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueText(value: unknown, key: string): string | undefined {
  return isRecord(value) && typeof value[key] === "string" ? value[key] : undefined;
}

function valueNumber(value: unknown, key: string): number | undefined {
  return isRecord(value) && typeof value[key] === "number" && Number.isFinite(value[key])
    ? value[key]
    : undefined;
}

function translatedLabel(
  id: string,
  entry: unknown,
  translations: Record<string, unknown>,
): string {
  const translation = translations[id];
  return valueText(translation, "displayName")
    ?? valueText(translation, "displayDescription")
    ?? valueText(entry, "name")
    ?? valueText(entry, "description")
    ?? id;
}

function translatedDescription(
  id: string,
  entry: unknown,
  translations: Record<string, unknown>,
): string | undefined {
  const localized = valueText(translations[id], "displayDescription");
  if (localized) return /^Описание отсутствует/i.test(localized) ? undefined : localized;
  return valueText(entry, "description");
}

function flaskOptions(data: FlaskRegexData): Option[] {
  const localizedPrefix = Array.isArray(data.translations.prefix) ? data.translations.prefix : [];
  const localizedSuffix = Array.isArray(data.translations.suffix) ? data.translations.suffix : [];
  const affixes = [
    ["prefix", localizedPrefix.length > 0 ? localizedPrefix : data.prefix],
    ["suffix", localizedSuffix.length > 0 ? localizedSuffix : data.suffix],
  ] as const;
  return affixes.flatMap(([affix, entries]) => entries.flatMap((entry) => {
    const description = valueText(entry, "description");
    if (!description) return [];
    return [{
      id: `${affix}:${description}`,
      label: valueText(entry, "displayDescription") ?? description,
      affix,
    }];
  }));
}

function flaskSelections(selected: string[]): Pick<FlaskProfileSettings, "selectedPrefix" | "selectedSuffix"> {
  return {
    selectedPrefix: selected.filter((id) => id.startsWith("prefix:")).map((id) => id.slice(7)),
    selectedSuffix: selected.filter((id) => id.startsWith("suffix:")).map((id) => id.slice(7)),
  };
}

function optionsFor(tool: ToolId, data: RegexDataByTool[RegexDataToolId]): Option[] {
  switch (tool) {
    case "vendor":
      return (data as VendorRegexData).gems.tokens.map((token) => ({ id: String(token.id), label: token.rawText, pattern: token.regex }));
    case "maps":
      return (data as MapRegexData).mods.tokens.map((token) => ({ id: String(token.id), label: token.rawText, pattern: token.regex }));
    case "items":
      return (data as ItemRegexData).bases.map((entry, index) => ({
        id: `${index}:${valueText(entry, "baseType") ?? valueText(entry, "name") ?? index}`,
        label: valueText(entry, "baseType") ?? valueText(entry, "name") ?? `#${index + 1}`,
      }));
    case "expedition": {
      const value = data as ExpeditionRegexData;
      const translations = isRecord(value.translations.bases) ? value.translations.bases : {};
      return Object.entries(value.baseTypeRegex).map(([id, entry]) => ({ id, label: translatedLabel(id, entry, translations) }));
    }
    case "heist": {
      const value = data as HeistRegexData;
      return heistContractLabels(value).map(({ id, primary, secondary }) => ({
        id,
        label: primary,
        secondaryLabel: secondary,
      }));
    }
    case "flasks": {
      return flaskOptions(data as FlaskRegexData);
    }
    case "scarabs": {
      const value = data as PricedEntriesRegexData;
      const entries = isRecord(value.entries) ? value.entries : {};
      return Object.entries(entries).map(([id, entry]) => ({
        chaosValue: valueNumber(entry, "chaosValue"),
        icon: valueText(entry, "icon"),
        id,
        label: translatedLabel(id, entry, value.translations),
        secondaryLabel: translatedDescription(id, entry, value.translations),
      })).sort((left, right) => (right.chaosValue ?? -1) - (left.chaosValue ?? -1) || left.label.localeCompare(right.label));
    }
    case "runegraft": {
      const value = data as PricedEntriesRegexData;
      const entries = Array.isArray(value.entries) ? value.entries : [];
      return entries.map((entry, index) => {
        const id = valueText(entry, "runegraft") ?? valueText(entry, "name") ?? String(index);
        return {
          chaosValue: valueNumber(entry, "chaosValue"),
          icon: valueText(entry, "icon"),
          id,
          label: translatedLabel(id, entry, value.translations),
          secondaryLabel: translatedDescription(id, entry, value.translations),
        };
      }).sort((left, right) => (right.chaosValue ?? -1) - (left.chaosValue ?? -1) || left.label.localeCompare(right.label));
    }
    case "beast":
    case "tattoo":
    {
      const value = data as EntriesRegexData;
      const entries = Array.isArray(value.entries) ? value.entries : [];
      const key = tool === "beast" ? "beast" : "tattoo";
      return entries.map((entry, index) => {
        const id = valueText(entry, key) ?? valueText(entry, "name") ?? String(index);
        return {
          id,
          icon: tool === "beast" ? beastIcon : tattooIcon,
          label: tool === "tattoo"
            ? valueText(value.translations[id], "displayName") ?? id
            : translatedLabel(id, entry, value.translations),
          secondaryLabel: tool === "tattoo"
            ? translatedDescription(id, entry, value.translations)
            : valueText(entry, "recipe"),
        };
      });
    }
    case "jewels": {
      const value = data as JewelRegexData;
      return value.regular.map((entry, index) => {
        const id = valueText(entry, "mod") ?? String(index);
        return { id, label: translatedLabel(id, entry, value.translations) };
      });
    }
  }
}

function compile(
  tool: ToolId,
  data: RegexDataByTool[RegexDataToolId],
  selected: string[],
  vendorSettings: VendorProfileSettings,
  flaskSettings: FlaskProfileSettings,
  locale: "en" | "ru",
): RegexCompileResult {
  switch (tool) {
    case "vendor": {
      const settings = normalizeVendorSettings({
        ...vendorSettings,
        gems: selected.map(Number).filter(Number.isSafeInteger),
      });
      return compileVendorRegex(settings, (data as VendorRegexData).gems, locale);
    }
    case "maps": {
      const settings = createDefaultMapSettings();
      settings.badIds = selected.map(Number).filter(Number.isSafeInteger);
      return compileMapRegex(settings, (data as MapRegexData).mods, locale);
    }
    case "items":
      return compileItemRegex({
        baseName: selected[0]?.split(":").slice(1).join(":") ?? "",
        selected: selected.map((id) => ({ pattern: id.split(":").slice(1).join(":"), kind: "prefix" as const })),
        mode: "any", matchOpenAffix: false,
      });
    case "expedition": return compileExpeditionRegex(selected, [], data as ExpeditionRegexData);
    case "heist": return compileHeistRegex(selected.map((name) => ({ name, start: 1, end: 1 })), 0, false, data as HeistRegexData);
    case "flasks": return compileFlaskRegex(normalizeFlaskSettings({
      ...flaskSettings,
      ...flaskSelections(selected),
    }), data as FlaskRegexData, locale);
    case "scarabs": return compileScarabRegex(selected, data as EntriesRegexData);
    case "runegraft": return compileRunegraftRegex(selected, data as EntriesRegexData);
    case "jewels": return compileJewelRegex({ selected, abyss: false, allMatch: false }, data as JewelRegexData);
    case "beast": {
      const value = data as EntriesRegexData;
      const entries = (Array.isArray(value.entries) ? value.entries : [])
        .filter((entry): entry is PricedBeastEntry => isRecord(entry) && selected.includes(valueText(entry, "beast") ?? ""));
      return compilePricedBeastRegex(entries, { includeHarvest: true, redOnly: false }, value.translations);
    }
    case "tattoo": {
      const value = data as EntriesRegexData;
      const entries = (Array.isArray(value.entries) ? value.entries : [])
        .filter((entry): entry is PricedTattooEntry => isRecord(entry) && selected.includes(valueText(entry, "tattoo") ?? ""));
      return compilePricedTattooRegex(entries, undefined, undefined, value.translations);
    }
  }
}

function selectedProfile(store: RegexProfileStore) {
  return store.profiles.find(({ name }) => name === store.selectedProfile)
    ?? store.profiles[0];
}

function storedSelection(store: RegexProfileStore, tool: ToolId): string[] {
  const profile = selectedProfile(store);
  if (!profile) return [];
  if (tool === "vendor") return profile.tools.vendor.gems.map(String);
  if (tool === "flasks") {
    const settings = normalizeFlaskSettings(profile.tools.flasks);
    return [
      ...settings.selectedPrefix.map((description) => `prefix:${description}`),
      ...settings.selectedSuffix.map((description) => `suffix:${description}`),
    ];
  }
  if (tool === "heist") {
    return Object.keys(normalizeHeistSettings(profile.tools.heist).contractLevels);
  }
  if (tool === "maps") {
    const settings = normalizeMapEditorSettings(profile.tools.maps);
    return Array.from(new Set([...settings.badIds, ...settings.goodIds])).map(String);
  }
  if (tool === "items") return normalizeItemEditorSettings(profile.tools.items).selectedMods.map(({ id }) => id);
  if (tool === "jewels") return normalizeJewelEditorSettings(profile.tools.jewels).selected;
  const settings = profile.tools[profileToolByRoute[tool]] as JsonObject;
  const fallbackKey: Partial<Record<ToolId, string>> = {
    maps: "badIds", expedition: "selectedBaseTypes",
    heist: "contractLevels", flasks: "selectedPrefix", scarabs: "selected",
    jewels: "selectedRegular",
  };
  const value = settings.selected ?? settings[fallbackKey[tool] ?? ""];
  return Array.isArray(value)
    ? value.filter((entry): entry is string | number => typeof entry === "string" || typeof entry === "number").map(String)
    : [];
}

function storedExpeditionSettings(store: RegexProfileStore): ExpeditionSettings {
  return normalizeExpeditionSettings(selectedProfile(store)?.tools.expedition);
}

function storedHeistSettings(store: RegexProfileStore): HeistProfileSettings {
  return normalizeHeistSettings(selectedProfile(store)?.tools.heist);
}

function storedMapSettings(store: RegexProfileStore): MapRegexSettings {
  return normalizeMapEditorSettings(selectedProfile(store)?.tools.maps);
}

function storedItemSettings(store: RegexProfileStore): ItemEditorSettings {
  return normalizeItemEditorSettings(selectedProfile(store)?.tools.items);
}

function storedJewelSettings(store: RegexProfileStore): JewelEditorSettings {
  return normalizeJewelEditorSettings(selectedProfile(store)?.tools.jewels);
}

function storedBeastSettings(store: RegexProfileStore): BeastEditorSettings {
  return normalizeBeastEditorSettings(selectedProfile(store)?.tools.beast);
}

function storedValueSettings(store: RegexProfileStore, tool: "tattoo" | "runegraft" | "scarabs"): ValueFilterSettings {
  return normalizeValueFilterSettings(selectedProfile(store)?.tools[profileToolByRoute[tool]]);
}

export default function RegexWorkspace() {
  const { toolId } = useParams();
  const { locale, t } = useI18n();
  const tool = regexEditorToolIds.includes(toolId as ToolId) ? toolId as ToolId : null;
  const [profileStore, setProfileStore] = useState<RegexProfileStore>(() =>
    loadProfileStore(window.localStorage),
  );
  const [loaded, setLoaded] = useState<LoadedData | null>(null);
  const data = loaded !== null && loaded.tool === tool && loaded.locale === locale
    ? loaded.value
    : null;
  const [selected, setSelected] = useState<string[]>([]);
  const [vendorSettings, setVendorSettings] = useState<VendorProfileSettings>(() =>
    normalizeVendorSettings(selectedProfile(profileStore)?.tools.vendor
      ?? createDefaultToolSettings().vendor),
  );
  const [flaskSettings, setFlaskSettings] = useState<FlaskProfileSettings>(() =>
    normalizeFlaskSettings(selectedProfile(profileStore)?.tools.flasks),
  );
  const [expeditionSettings, setExpeditionSettings] = useState<ExpeditionSettings>(() =>
    storedExpeditionSettings(profileStore),
  );
  const [heistSettings, setHeistSettings] = useState<HeistProfileSettings>(() =>
    storedHeistSettings(profileStore),
  );
  const [mapSettings, setMapSettings] = useState<MapRegexSettings>(() => storedMapSettings(profileStore));
  const [itemSettings, setItemSettings] = useState<ItemEditorSettings>(() => storedItemSettings(profileStore));
  const [jewelSettings, setJewelSettings] = useState<JewelEditorSettings>(() => storedJewelSettings(profileStore));
  const [beastSettings, setBeastSettings] = useState<BeastEditorSettings>(() => storedBeastSettings(profileStore));
  const [valueSettings, setValueSettings] = useState<ValueFilterSettings>({});
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState<"A" | "B" | null>(null);
  const [buildGemReport, setBuildGemReport] = useState<BuildGemMatch | null>(null);
  const requiredGems = useAtomValue(requiredGemsSelector);

  useEffect(() => {
    if (tool === null) return;
    let active = true;
    setLoaded(null);
    setSelected(storedSelection(profileStore, tool));
    setVendorSettings(normalizeVendorSettings(
      selectedProfile(profileStore)?.tools.vendor ?? createDefaultToolSettings().vendor,
    ));
    setFlaskSettings(normalizeFlaskSettings(selectedProfile(profileStore)?.tools.flasks));
    setExpeditionSettings(storedExpeditionSettings(profileStore));
    setHeistSettings(storedHeistSettings(profileStore));
    setMapSettings(storedMapSettings(profileStore));
    setItemSettings(storedItemSettings(profileStore));
    setJewelSettings(storedJewelSettings(profileStore));
    setBeastSettings(storedBeastSettings(profileStore));
    setValueSettings(tool === "tattoo" || tool === "runegraft" || tool === "scarabs"
      ? storedValueSettings(profileStore, tool) : {});
    setQuery("");
    setBuildGemReport(null);
    loadRegexData(dataToolByRoute[tool], locale).then((value) => {
      if (active) setLoaded({ tool, locale, value });
    });
    return () => { active = false; };
  }, [locale, tool]);

  const options = useMemo(() => tool && data ? optionsFor(tool, data) : [], [data, tool]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return options.filter(({ label, secondaryLabel }) => needle === "" ||
      `${label} ${secondaryLabel ?? ""}`.toLocaleLowerCase().includes(needle))
      .filter(({ chaosValue }) => tool === "scarabs" || tool === "runegraft" || tool === "tattoo"
        ? valueFilterMatches(chaosValue, valueSettings) : true);
  }, [options, query, tool, valueSettings]);
  const visible = showAll ? filtered : filtered.slice(0, 160);
  const marketSelected = useMemo(() => selectedWithinValueFilter(selected, options, valueSettings),
    [options, selected, valueSettings]);
  const vendorSections = useMemo(() => {
    if (tool !== "vendor" || data === null) return [];
    const needle = query.trim().toLocaleLowerCase();
    const tokens = (data as VendorRegexData).gems.tokens.filter(({ rawText }) =>
      needle === "" || rawText.toLocaleLowerCase().includes(needle));
    return groupVendorGems(tokens);
  }, [data, query, tool]);
  const expeditionEntries = useMemo(() => {
    if (tool !== "expedition" || data === null) return [];
    const needle = query.trim().toLocaleLowerCase();
    return expeditionCatalog(data as ExpeditionRegexData).filter((entry) =>
      (entry.maxChaosValue >= expeditionSettings.minValueToDisplay || selected.includes(entry.id)) &&
      (needle === "" || entry.searchText.includes(needle)));
  }, [data, expeditionSettings.minValueToDisplay, query, selected, tool]);
  const expeditionFillers = useMemo(() => {
    if (tool !== "expedition" || data === null || !expeditionSettings.addFillerItems) return [];
    return valuableExpeditionFillers(selected, expeditionSettings.minAddValue, data as ExpeditionRegexData);
  }, [data, expeditionSettings.addFillerItems, expeditionSettings.minAddValue, selected, tool]);
  const beastEntries = useMemo(() => {
    if (tool !== "beast" || data === null) return [];
    const needle = query.trim().toLocaleLowerCase();
    return bestiaryCatalog(data as EntriesRegexData, locale)
      .filter(({ harvest, red }) => (beastSettings.includeHarvest || !harvest) && (!beastSettings.redOnly || red))
      .filter(({ searchText }) => needle === "" || searchText.includes(needle));
  }, [beastSettings.includeHarvest, beastSettings.redOnly, data, locale, query, tool]);
  const itemCategories = useMemo(() => {
    if (tool !== "items" || data === null) return [];
    return (data as ItemRegexData).bases.flatMap((candidate) => {
      const name = valueText(candidate, "name");
      return name ? [name] : [];
    });
  }, [data, tool]);
  const itemMods = useMemo(() => {
    if (tool !== "items" || data === null || !itemSettings.baseCategory) return [];
    const needle = query.trim().toLocaleLowerCase();
    return itemModCatalog(data as ItemRegexData, itemSettings.baseCategory).filter(({ label }) =>
      needle === "" || label?.toLocaleLowerCase().includes(needle));
  }, [data, itemSettings.baseCategory, query, tool]);
  const itemBases = useMemo(() => tool === "items" && data !== null && itemSettings.baseCategory
    ? itemBaseOptions(data as ItemRegexData, itemSettings.baseCategory) : [],
  [data, itemSettings.baseCategory, tool]);
  const visibleJewelOptions = useMemo(() => {
    if (tool !== "jewels" || data === null) return [];
    const needle = query.trim().toLocaleLowerCase();
    return jewelOptions(data as JewelRegexData, jewelSettings).filter(({ id, label }) =>
      needle === "" || `${label} ${id}`.toLocaleLowerCase().includes(needle));
  }, [data, jewelSettings, query, tool]);
  const result = useMemo(() => {
    if (!tool || !data) return emptyResult;
    if (tool === "expedition") {
      return compileExpeditionRegex(selected, expeditionFillers, data as ExpeditionRegexData);
    }
    if (tool === "heist") {
      const input = heistCompileInput(heistSettings);
      return compileHeistRegex(input.contracts, input.targetValue, input.requireBoth, data as HeistRegexData);
    }
    if (tool === "maps") return compileMapRegex(mapSettings, (data as MapRegexData).mods, locale);
    if (tool === "items") return compileItemRegex(itemCompileInput(itemSettings));
    if (tool === "jewels") return compileJewelRegex(jewelSettings, data as JewelRegexData, locale);
    if (tool === "scarabs") return compileScarabRegex(marketSelected, data as EntriesRegexData);
    if (tool === "runegraft") return compileRunegraftRegex(marketSelected, data as EntriesRegexData);
    if (tool === "beast") {
      const value = data as EntriesRegexData;
      const entries = (Array.isArray(value.entries) ? value.entries : [])
        .filter((entry): entry is PricedBeastEntry => isRecord(entry) && selected.includes(valueText(entry, "beast") ?? ""));
      return compilePricedBeastRegex(entries, beastSettings, value.translations);
    }
    if (tool === "tattoo") {
      const value = data as EntriesRegexData;
      const entries = (Array.isArray(value.entries) ? value.entries : [])
        .filter((entry): entry is PricedTattooEntry => isRecord(entry) && selected.includes(valueText(entry, "tattoo") ?? ""));
      return compilePricedTattooRegex(entries, valueSettings.minValue, valueSettings.maxValue, value.translations);
    }
    return compile(tool, data, selected, vendorSettings, flaskSettings, locale);
  }, [beastSettings, data, expeditionFillers, flaskSettings, heistSettings, itemSettings, jewelSettings, locale, mapSettings, marketSelected, selected, tool, valueSettings, vendorSettings]);

  if (tool === null) return <Navigate to="/regex" replace />;
  const title = t(`regex.tool.${tool}` as MessageKey);
  const persist = (
    nextSelected: string[],
    nextVendorSettings: VendorProfileSettings = vendorSettings,
  ) => {
    const draft = JSON.parse(JSON.stringify(profileStore)) as RegexProfileStore;
    const profile = selectedProfile(draft);
    if (!profile) return;
    if (tool === "vendor") {
      profile.tools.vendor = normalizeVendorSettings({
        ...nextVendorSettings,
        gems: nextSelected.map(Number).filter(Number.isSafeInteger),
      });
    } else if (tool === "flasks") {
      profile.tools.flasks = normalizeFlaskSettings({
        ...flaskSettings,
        ...flaskSelections(nextSelected),
      });
    } else {
      const key = profileToolByRoute[tool] as Exclude<keyof RegexToolProfileSettings, "vendor" | "flasks">;
      profile.tools[key] = { ...profile.tools[key], selected: nextSelected };
    }
    try {
      setProfileStore(saveProfileStore(window.localStorage, draft));
    } catch {
      // Browsing stays functional when storage is disabled or full.
    }
  };
  const toggle = (id: string) => setSelected((current) => {
    const next = current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id];
    persist(next);
    return next;
  });
  const updateVendor = (next: VendorProfileSettings) => {
    setVendorSettings(next);
    persist(selected, next);
  };
  const updateFlasks = (next: FlaskProfileSettings) => {
    setFlaskSettings(next);
    const draft = JSON.parse(JSON.stringify(profileStore)) as RegexProfileStore;
    const profile = selectedProfile(draft);
    if (!profile) return;
    profile.tools.flasks = normalizeFlaskSettings({ ...next, ...flaskSelections(selected) });
    try {
      setProfileStore(saveProfileStore(window.localStorage, draft));
    } catch {
      // Browsing stays functional when storage is disabled or full.
    }
  };
  const updateExpedition = (next: ExpeditionSettings) => {
    setExpeditionSettings(next);
    const draft = JSON.parse(JSON.stringify(profileStore)) as RegexProfileStore;
    const profile = selectedProfile(draft);
    if (!profile) return;
    profile.tools.expedition = { ...profile.tools.expedition, ...next, selected };
    try {
      setProfileStore(saveProfileStore(window.localStorage, draft));
    } catch {
      // Browsing stays functional when storage is disabled or full.
    }
  };
  const updateHeist = (nextValue: HeistProfileSettings) => {
    const next = normalizeHeistSettings(nextValue);
    setHeistSettings(next);
    setSelected(Object.keys(next.contractLevels));
    const draft = JSON.parse(JSON.stringify(profileStore)) as RegexProfileStore;
    const profile = selectedProfile(draft);
    if (!profile) return;
    profile.tools.heist = { ...next, selected: Object.keys(next.contractLevels) };
    try {
      setProfileStore(saveProfileStore(window.localStorage, draft));
    } catch {
      // Browsing stays functional when storage is disabled or full.
    }
  };
  const toggleHeistContract = (name: string) => {
    const contractLevels = { ...heistSettings.contractLevels };
    if (contractLevels[name]) delete contractLevels[name];
    else contractLevels[name] = { start: 1, end: 5 };
    updateHeist({ ...heistSettings, contractLevels });
  };
  const saveJsonTool = (key: "maps" | "items" | "jewels" | "beast" | "tattoos" | "runegrafts" | "scarabs", value: JsonObject) => {
    const draft = JSON.parse(JSON.stringify(profileStore)) as RegexProfileStore;
    const profile = selectedProfile(draft);
    if (!profile) return;
    profile.tools[key] = value;
    try {
      setProfileStore(saveProfileStore(window.localStorage, draft));
    } catch {
      // Browsing stays functional when storage is disabled or full.
    }
  };
  const updateMaps = (value: unknown) => {
    const next = normalizeMapEditorSettings(value);
    setMapSettings(next);
    setSelected(Array.from(new Set([...next.badIds, ...next.goodIds])).map(String));
    saveJsonTool("maps", next as unknown as JsonObject);
  };
  const updateItems = (value: unknown) => {
    const next = normalizeItemEditorSettings(value);
    setItemSettings(next);
    setSelected(next.selectedMods.map(({ id }) => id));
    saveJsonTool("items", next as unknown as JsonObject);
  };
  const updateJewels = (value: unknown) => {
    const next = normalizeJewelEditorSettings(value);
    setJewelSettings(next);
    setSelected(next.selected);
    saveJsonTool("jewels", {
      abyssJewel: next.abyss,
      allMatch: next.allMatch,
      magicOnly: next.magicOnly,
      matchBothPrefixAndSuffix: next.requireBoth,
      matchOpenPrefixSuffix: next.matchOpenAffix,
      selected: next.selected,
      [next.abyss ? "selectedAbyss" : "selectedRegular"]: next.selected,
    });
  };
  const updateBeasts = (value: unknown) => {
    const next = normalizeBeastEditorSettings(value);
    setBeastSettings(next);
    saveJsonTool("beast", {
      selected,
      includeHarvest: next.includeHarvest,
      redBeastsOnly: next.redOnly,
      menagerieLimit: next.menagerieLimit,
      ...(next.minValue === undefined ? {} : { minChaosValue: next.minValue }),
      ...(next.maxValue === undefined ? {} : { maxChaosValue: next.maxValue }),
    });
  };
  const updateValueSettings = (value: unknown) => {
    const next = normalizeValueFilterSettings(value);
    setValueSettings(next);
    if (tool !== "tattoo" && tool !== "runegraft" && tool !== "scarabs") return;
    saveJsonTool(profileToolByRoute[tool] as "tattoos" | "runegrafts" | "scarabs", {
      selected,
      ...(next.minValue === undefined ? {} : { minValue: next.minValue }),
      ...(next.maxValue === undefined ? {} : { maxValue: next.maxValue }),
    });
  };
  const toggleVendorGroup = (group: VendorBooleanGroup, key: string) => {
    const values = vendorSettings[group] as Record<string, boolean>;
    updateVendor({
      ...vendorSettings,
      [group]: { ...values, [key]: !values[key] },
    } as VendorProfileSettings);
  };
  const reset = () => {
    const nextVendor = createDefaultToolSettings().vendor;
    const nextFlasks = createDefaultToolSettings().flasks;
    const nextExpedition = defaultExpeditionSettings();
    setSelected([]);
    setVendorSettings(nextVendor);
    setFlaskSettings(nextFlasks);
    setExpeditionSettings(nextExpedition);
    setHeistSettings(normalizeHeistSettings({}));
    setMapSettings(normalizeMapEditorSettings({}));
    setItemSettings(normalizeItemEditorSettings({}));
    setJewelSettings(normalizeJewelEditorSettings({}));
    setBeastSettings(normalizeBeastEditorSettings({}));
    setValueSettings({});
    setBuildGemReport(null);
    if (tool === "expedition") updateExpedition(nextExpedition);
    if (tool === "heist") updateHeist(normalizeHeistSettings({}));
    if (tool === "maps") updateMaps({});
    if (tool === "items") updateItems({});
    if (tool === "jewels") updateJewels({});
    if (tool === "beast") updateBeasts({});
    if (tool === "tattoo" || tool === "runegraft" || tool === "scarabs") updateValueSettings({});
    persist([], nextVendor);
  };
  const copy = async (value: string, pass: "A" | "B") => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(pass);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>PoE Tools · Regex</p>
          <h1>{title}</h1>
        </div>
        <Link to="/regex">{t("regex.workspace.back")}</Link>
      </header>
      <div className={styles.layout}>
        <section className={styles.controls} aria-label={title}>
          {tool === "vendor" && (
            <>
            <div className={styles.vendorFilters}>
              <fieldset className={styles.linkFieldset}>
                <legend>{t("regex.workspace.links")}</legend>
                {[2, 3, 4, 5, 6].map((count) => (
                  <label key={count}>
                    <input
                      type="checkbox"
                      checked={vendorSettings.linkCounts.includes(count as LinkCount)}
                      onChange={() => updateVendor({
                        ...vendorSettings,
                        linkCounts: vendorSettings.linkCounts.includes(count as LinkCount)
                          ? vendorSettings.linkCounts.filter((value) => value !== count)
                          : [...vendorSettings.linkCounts, count as LinkCount].sort(),
                      })}
                    />
                    {count}L
                  </label>
                ))}
              </fieldset>
              {vendorGroups.map((group) => (
                <fieldset className={styles.linkFieldset} key={group.key}>
                  <legend>{t(group.title)}</legend>
                  {group.options.map(([key, labelKey]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={(vendorSettings[group.key] as Record<string, boolean>)[key]}
                        onChange={() => toggleVendorGroup(group.key, key)}
                      />
                      {t(labelKey)}
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
            <div className={styles.vendorBuildImport}>
              <button
                disabled={requiredGems.length === 0 || data === null}
                onClick={() => {
                  if (data === null) return;
                  const match = matchBuildGems(
                    requiredGems,
                    (data as VendorRegexData).gems.tokens,
                    selected.map(Number).filter(Number.isSafeInteger),
                  );
                  const next = match.selectedTokenIds.map(String);
                  setSelected(next);
                  persist(next);
                  setBuildGemReport(match);
                }}
                type="button"
              >
                {t("regex.workspace.vendor.selectBuildGems")}
              </button>
              {requiredGems.length === 0 && <span>{t("regex.workspace.vendor.noBuildGems")}</span>}
              {buildGemReport && (
                <span>{t("regex.workspace.vendor.buildGemReport", {
                  selected: buildGemReport.selectedTokenIds.length,
                  existing: buildGemReport.alreadySelectedTokenIds.length,
                  unavailable: buildGemReport.unavailableGameIds.length,
                  unknown: buildGemReport.unknownGameIds.length,
                })}</span>
              )}
            </div>
            </>
          )}
          {tool === "flasks" && (
            <div className={styles.flaskSettings}>
              <label className={styles.numberField}>
                <span>{t("regex.workspace.flasks.itemLevel")}</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={flaskSettings.itemLevel}
                  onChange={(event) => updateFlasks(normalizeFlaskSettings({
                    ...flaskSettings,
                    itemLevel: event.target.value,
                  }))}
                />
              </label>
              {([
                ["requireBoth", "regex.workspace.flasks.requireBoth"],
                ["matchOpenAffix", "regex.workspace.flasks.openAffix"],
                ["ignoreEffectTiers", "regex.workspace.flasks.ignoreEffectTier"],
                ["onlyMaxPrefix", "regex.workspace.flasks.highestPrefix"],
                ["onlyMaxSuffix", "regex.workspace.flasks.highestSuffix"],
              ] as const).map(([key, label]) => (
                <label className={styles.settingToggle} key={key}>
                  <input
                    type="checkbox"
                    checked={flaskSettings[key]}
                    onChange={() => updateFlasks({ ...flaskSettings, [key]: !flaskSettings[key] })}
                  />
                  <span>{t(label)}</span>
                </label>
              ))}
            </div>
          )}
          {tool === "expedition" && data !== null && (
            <div className={styles.expeditionSettings}>
              <label className={styles.numberField}>
                <span>{t("regex.workspace.expedition.displayValue")}</span>
                <input
                  type="number"
                  min="0"
                  value={expeditionSettings.minValueToDisplay}
                  onChange={(event) => updateExpedition(normalizeExpeditionSettings({
                    ...expeditionSettings,
                    minValueToDisplay: Number(event.target.value),
                  }))}
                />
              </label>
              <label className={styles.settingToggle}>
                <input
                  type="checkbox"
                  checked={expeditionSettings.addFillerItems}
                  onChange={() => updateExpedition({
                    ...expeditionSettings,
                    addFillerItems: !expeditionSettings.addFillerItems,
                  })}
                />
                <span>{t("regex.workspace.expedition.autoAdd")}</span>
              </label>
              <label className={styles.numberField}>
                <span>{t("regex.workspace.expedition.autoValue")}</span>
                <input
                  type="number"
                  min="0"
                  value={expeditionSettings.minAddValue}
                  onChange={(event) => updateExpedition(normalizeExpeditionSettings({
                    ...expeditionSettings,
                    minAddValue: Number(event.target.value),
                  }))}
                />
              </label>
              <p className={styles.economyMeta}>
                {t("regex.workspace.expedition.economy", {
                  league: (data as ExpeditionRegexData).priceLeague,
                  date: new Intl.DateTimeFormat(locale).format(new Date((data as ExpeditionRegexData).priceUpdatedAt)),
                })}
              </p>
            </div>
          )}
          {tool === "heist" && (
            <div className={styles.heistSettings}>
              <label className={styles.numberField}>
                <span>{t("regex.workspace.heist.targetValue")}</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={heistSettings.targetValue}
                  onChange={(event) => updateHeist({ ...heistSettings, targetValue: Number(event.target.value) })}
                />
              </label>
              <label className={styles.settingToggle}>
                <input
                  type="checkbox"
                  checked={heistSettings.requireCoinValue}
                  onChange={() => updateHeist({
                    ...heistSettings,
                    requireCoinValue: !heistSettings.requireCoinValue,
                  })}
                />
                <span>{t("regex.workspace.heist.requireBoth")}</span>
              </label>
              <button
                className={styles.heistPreset}
                type="button"
                onClick={() => updateHeist({
                  ...heistSettings,
                  contractLevels: {
                    "Counter-Thaumaturgy": { start: 1, end: 5 },
                    Deception: { start: 1, end: 5 },
                    Perception: { start: 1, end: 5 },
                  },
                })}
              >
                {t("regex.workspace.heist.giannaPreset")}
              </button>
            </div>
          )}
          {tool === "maps" && (
            <div className={styles.advancedSettings}>
              {([
                ["quantity", "regex.workspace.maps.quantity"],
                ["packsize", "regex.workspace.maps.packsize"],
                ["itemRarity", "regex.workspace.maps.itemRarity"],
                ["mapDropChance", "regex.workspace.maps.mapDropChance"],
              ] as const).map(([key, label]) => (
                <label className={styles.numberField} key={key}>
                  <span>{t(label)}</span>
                  <input value={mapSettings[key]} inputMode="numeric" onChange={(event) => updateMaps({
                    ...mapSettings, [key]: event.target.value,
                  })} />
                </label>
              ))}
              {([
                ["allGoodMods", "regex.workspace.maps.allGood"],
                ["displayNightmareMods", "regex.workspace.maps.nightmare"],
                ["optimizeQuant", "regex.workspace.maps.optimizeQuant"],
                ["optimizePacksize", "regex.workspace.maps.optimizePacksize"],
                ["optimizeQuality", "regex.workspace.maps.optimizeQuality"],
                ["anyQuality", "regex.workspace.maps.anyQuality"],
              ] as const).map(([key, label]) => (
                <label className={styles.settingToggle} key={key}>
                  <input type="checkbox" checked={mapSettings[key]} onChange={() => updateMaps({
                    ...mapSettings, [key]: !mapSettings[key],
                  })} />
                  <span>{t(label)}</span>
                </label>
              ))}
              {(["corrupted", "unidentified"] as const).map((key) => (
                <fieldset className={styles.inlineFieldset} key={key}>
                  <legend>{t(`regex.workspace.maps.${key}`)}</legend>
                  <label><input type="checkbox" checked={mapSettings[key].enabled} onChange={() => updateMaps({
                    ...mapSettings, [key]: { ...mapSettings[key], enabled: !mapSettings[key].enabled },
                  })} />{t("regex.workspace.maps.enabled")}</label>
                  <label><input type="checkbox" checked={mapSettings[key].include} onChange={() => updateMaps({
                    ...mapSettings, [key]: { ...mapSettings[key], include: !mapSettings[key].include },
                  })} />{t("regex.workspace.maps.include")}</label>
                </fieldset>
              ))}
              <fieldset className={styles.inlineFieldset}>
                <legend>{t("regex.workspace.maps.rarity")}</legend>
                {(["normal", "magic", "rare"] as const).map((key) => (
                  <label key={key}><input type="checkbox" checked={mapSettings.rarity[key]} onChange={() => updateMaps({
                    ...mapSettings, rarity: { ...mapSettings.rarity, [key]: !mapSettings.rarity[key] },
                  })} />{t(`regex.workspace.maps.rarity.${key}`)}</label>
                ))}
                <label><input type="checkbox" checked={mapSettings.rarity.include} onChange={() => updateMaps({
                  ...mapSettings, rarity: { ...mapSettings.rarity, include: !mapSettings.rarity.include },
                })} />{t("regex.workspace.maps.include")}</label>
              </fieldset>
              {Object.entries(mapSettings.quality).map(([key, value]) => (
                <label className={styles.numberField} key={key}>
                  <span>{t(`regex.workspace.maps.quality.${key}` as MessageKey)}</span>
                  <input value={value} inputMode="numeric" onChange={(event) => updateMaps({
                    ...mapSettings, quality: { ...mapSettings.quality, [key]: event.target.value },
                  })} />
                </label>
              ))}
              <label className={styles.wideField}>
                <span>{t("regex.workspace.maps.custom")}</span>
                <input value={mapSettings.customText.value} onChange={(event) => updateMaps({
                  ...mapSettings, customText: { enabled: true, value: event.target.value },
                })} />
              </label>
            </div>
          )}
          {tool === "items" && (
            <div className={styles.advancedSettings}>
              <label className={styles.wideField}>
                <span>{t("regex.workspace.items.category")}</span>
                <select value={itemSettings.baseCategory} onChange={(event) => updateItems({
                  ...itemSettings, baseCategory: event.target.value, selectedMods: [],
                })}>
                  <option value="">—</option>
                  {itemCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className={styles.wideField}>
                <span>{t("regex.workspace.items.base")}</span>
                <input list="regex-item-bases" value={itemSettings.baseName} onChange={(event) => updateItems({
                  ...itemSettings, baseName: event.target.value,
                })} />
                <datalist id="regex-item-bases">
                  {itemBases.map((name) => <option key={name} value={name} />)}
                </datalist>
              </label>
              <label className={styles.wideField}>
                <span>{t("regex.workspace.items.mode")}</span>
                <select value={itemSettings.mode} onChange={(event) => updateItems({
                  ...itemSettings, mode: event.target.value,
                })}>
                  <option value="any">{t("regex.workspace.mode.any")}</option>
                  <option value="all">{t("regex.workspace.mode.all")}</option>
                  <option value="prefix-and-suffix">{t("regex.workspace.mode.prefixSuffix")}</option>
                </select>
              </label>
              <label className={styles.settingToggle}>
                <input type="checkbox" checked={itemSettings.matchOpenAffix} onChange={() => updateItems({
                  ...itemSettings, matchOpenAffix: !itemSettings.matchOpenAffix,
                })} />
                <span>{t("regex.workspace.items.openAffix")}</span>
              </label>
            </div>
          )}
          {tool === "jewels" && (
            <div className={styles.advancedSettings}>
              {([
                ["abyss", "regex.workspace.jewels.abyss"],
                ["allMatch", "regex.workspace.mode.all"],
                ["magicOnly", "regex.workspace.jewels.magicOnly"],
              ] as const).map(([key, label]) => (
                <label className={styles.settingToggle} key={key}>
                  <input type="checkbox" checked={jewelSettings[key]} onChange={() => updateJewels({
                    ...jewelSettings, [key]: !jewelSettings[key], selected: key === "abyss" ? [] : jewelSettings.selected,
                  })} />
                  <span>{t(label)}</span>
                </label>
              ))}
              {jewelSettings.magicOnly && ([
                ["requireBoth", "regex.workspace.jewels.requireBoth"],
                ["matchOpenAffix", "regex.workspace.jewels.openAffix"],
              ] as const).map(([key, label]) => (
                <label className={styles.settingToggle} key={key}>
                  <input type="checkbox" checked={jewelSettings[key]} onChange={() => updateJewels({
                    ...jewelSettings, [key]: !jewelSettings[key],
                  })} />
                  <span>{t(label)}</span>
                </label>
              ))}
            </div>
          )}
          {tool === "beast" && (
            <div className={styles.advancedSettings}>
              {([
                ["includeHarvest", "regex.workspace.beast.includeHarvest"],
                ["redOnly", "regex.workspace.beast.redOnly"],
                ["menagerieLimit", "regex.workspace.beast.menagerieLimit"],
              ] as const).map(([key, label]) => (
                <label className={styles.settingToggle} key={key}>
                  <input type="checkbox" checked={beastSettings[key]} onChange={() => updateBeasts({
                    ...beastSettings, [key]: !beastSettings[key],
                  })} />
                  <span>{t(label)}</span>
                </label>
              ))}
            </div>
          )}
          {(tool === "scarabs" || tool === "runegraft") && data !== null && (
            <div className={styles.advancedSettings}>
              {(["minValue", "maxValue"] as const).map((key) => (
                <label className={styles.numberField} key={key}>
                  <span>{t(`regex.workspace.market.${key}`)}</span>
                  <input
                    min="0"
                    step="1"
                    type="number"
                    value={valueSettings[key] ?? ""}
                    onChange={(event) => updateValueSettings({
                      ...valueSettings,
                      [key]: event.target.value === "" ? undefined : Number(event.target.value),
                    })}
                  />
                </label>
              ))}
              <p className={styles.economyMeta}>
                {t("regex.workspace.expedition.economy", {
                  league: (data as PricedEntriesRegexData).priceLeague,
                  date: new Intl.DateTimeFormat(locale).format(new Date((data as PricedEntriesRegexData).priceUpdatedAt)),
                })}
              </p>
            </div>
          )}
          <label className={styles.search}>
            <span>{t("regex.workspace.search")}</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className={styles.summary}>
            <span>{t("regex.workspace.selected")}: {selected.length}</span>
            {tool === "expedition" && expeditionFillers.length > 0 && (
              <span>{t("regex.workspace.expedition.autoAdded", { count: expeditionFillers.length })}</span>
            )}
            {(tool === "scarabs" || tool === "runegraft") && (
              <>
                <button type="button" onClick={() => {
                  const next = Array.from(new Set([...selected, ...filtered.map(({ id }) => id)]));
                  setSelected(next);
                  persist(next);
                }}>{t("regex.workspace.market.selectVisible")}</button>
                <button type="button" onClick={() => {
                  const filteredIds = new Set(filtered.map(({ id }) => id));
                  const next = selected.filter((id) => !filteredIds.has(id));
                  setSelected(next);
                  persist(next);
                }}>{t("regex.workspace.market.clearVisible")}</button>
              </>
            )}
            <button type="button" onClick={reset}>
              {t("regex.workspace.reset")}
            </button>
          </div>
          {data === null ? <p>{t("regex.workspace.loading")}</p> : tool === "vendor" ? (
            <div className={styles.gemSections}>
              {vendorSections.map((section) => (
                <section
                  className={styles.gemSection}
                  data-color={section.color}
                  key={`${section.color}:${section.support}`}
                >
                  <header className={styles.gemSectionHeader}>
                    <h2>
                      {t(`regex.workspace.vendor.color.${section.color}` as MessageKey)} · {t(
                        section.support
                          ? "regex.workspace.vendor.support"
                          : "regex.workspace.vendor.active",
                      )}
                    </h2>
                    <span>{section.tokens.length}</span>
                  </header>
                  <div className={styles.gemGrid}>
                    {section.tokens.map((token) => {
                      const id = String(token.id);
                      return (
                        <label className={styles.gemOption} key={id}>
                          <input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} />
                          <EntityImage alt="" src={token.icon} />
                          <span>{token.rawText}</span>
                          <small>{t("regex.workspace.vendor.requiredLevel", { level: token.requiredLevel })}</small>
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : tool === "flasks" ? (
            <div className={styles.flaskColumns}>
              {(["prefix", "suffix"] as const).map((affix) => (
                <section className={styles.flaskColumn} key={affix}>
                  <h2>{t(`regex.workspace.flasks.${affix}`)}</h2>
                  <div className={styles.options}>
                    {filtered.filter((option) => option.affix === affix).map((option) => (
                      <label className={styles.option} key={option.id}>
                        <input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : tool === "maps" ? (
            <div className={styles.mapGrid}>
              {visible.map((option) => {
                const id = Number(option.id);
                return (
                  <article className={styles.mapOption} key={option.id}>
                    <span>{option.label}</span>
                    <label><input type="checkbox" checked={mapSettings.badIds.includes(id)} onChange={() => updateMaps({
                      ...mapSettings,
                      badIds: mapSettings.badIds.includes(id)
                        ? mapSettings.badIds.filter((value) => value !== id)
                        : [...mapSettings.badIds, id],
                      goodIds: mapSettings.goodIds.filter((value) => value !== id),
                    })} />{t("regex.workspace.maps.exclude")}</label>
                    <label><input type="checkbox" checked={mapSettings.goodIds.includes(id)} onChange={() => updateMaps({
                      ...mapSettings,
                      goodIds: mapSettings.goodIds.includes(id)
                        ? mapSettings.goodIds.filter((value) => value !== id)
                        : [...mapSettings.goodIds, id],
                      badIds: mapSettings.badIds.filter((value) => value !== id),
                    })} />{t("regex.workspace.maps.require")}</label>
                  </article>
                );
              })}
            </div>
          ) : tool === "items" ? (
            <div className={styles.options}>
              {itemMods.slice(0, showAll ? itemMods.length : 160).map((option) => (
                <label className={styles.option} key={option.id}>
                  <input
                    type="checkbox"
                    checked={itemSettings.selectedMods.some(({ id }) => id === option.id)}
                    onChange={() => updateItems({
                      ...itemSettings,
                      selectedMods: itemSettings.selectedMods.some(({ id }) => id === option.id)
                        ? itemSettings.selectedMods.filter(({ id }) => id !== option.id)
                        : [...itemSettings.selectedMods, option],
                    })}
                  />
                  <span className={styles.optionText}><span>{option.label}</span><small>{option.kind}</small></span>
                </label>
              ))}
              {!showAll && itemMods.length > 160 && <button className={styles.showAll} type="button" onClick={() => setShowAll(true)}>
                {t("regex.workspace.showAll")} ({itemMods.length})
              </button>}
            </div>
          ) : tool === "jewels" ? (
            <div className={styles.options}>
              {visibleJewelOptions.slice(0, showAll ? visibleJewelOptions.length : 160).map((option) => (
                <label className={styles.option} key={option.id}>
                  <input type="checkbox" checked={jewelSettings.selected.includes(option.id)} onChange={() => updateJewels({
                    ...jewelSettings,
                    selected: jewelSettings.selected.includes(option.id)
                      ? jewelSettings.selected.filter((id) => id !== option.id)
                      : [...jewelSettings.selected, option.id],
                  })} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          ) : tool === "beast" ? (
            <div className={styles.beastGrid}>
              {beastEntries.map((entry) => (
                <article className={styles.beastOption} key={entry.id}>
                  <label>
                    <input type="checkbox" checked={selected.includes(entry.id)} onChange={() => toggle(entry.id)} />
                    <EntityImage alt="" src={beastIcon} size={34} />
                    <span className={styles.optionText}>
                      <strong>{entry.label}</strong>
                      <small>{entry.id}</small>
                      {entry.recipe && <span className={styles.beastRecipe}>{entry.recipe}</span>}
                    </span>
                  </label>
                  <div className={styles.beastLinks}>
                    <a href={entry.tradeUrl} target="_blank" rel="noreferrer">{t("regex.workspace.beast.priceCheck")}</a>
                    <a href={entry.wikiUrl} target="_blank" rel="noreferrer">Wiki</a>
                  </div>
                </article>
              ))}
            </div>
          ) : tool === "heist" ? (
            <div className={styles.heistGrid}>
              {visible.map((option) => {
                const range = heistSettings.contractLevels[option.id];
                return (
                  <div className={styles.heistOption} key={option.id}>
                    <label>
                      <input type="checkbox" checked={Boolean(range)} onChange={() => toggleHeistContract(option.id)} />
                      <EntityImage alt="" src={heistIcon} size={32} />
                      <span className={styles.optionText}>
                        <strong>{option.label}</strong>
                        {option.secondaryLabel && <small>{option.secondaryLabel}</small>}
                      </span>
                    </label>
                    <div className={styles.heistRange} aria-label={t("regex.workspace.heist.levelRange")}>
                      <select
                        aria-label={t("regex.workspace.heist.levelFrom")}
                        disabled={!range}
                        value={range?.start ?? 1}
                        onChange={(event) => updateHeist({
                          ...heistSettings,
                          contractLevels: {
                            ...heistSettings.contractLevels,
                            [option.id]: { start: Number(event.target.value), end: range?.end ?? 5 },
                          },
                        })}
                      >
                        {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}
                      </select>
                      <span>–</span>
                      <select
                        aria-label={t("regex.workspace.heist.levelTo")}
                        disabled={!range}
                        value={range?.end ?? 5}
                        onChange={(event) => updateHeist({
                          ...heistSettings,
                          contractLevels: {
                            ...heistSettings.contractLevels,
                            [option.id]: { start: range?.start ?? 1, end: Number(event.target.value) },
                          },
                        })}
                      >
                        {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : tool === "expedition" ? (
            <div className={styles.expeditionGrid}>
              {expeditionEntries.map((entry) => (
                <label className={styles.expeditionOption} key={entry.id}>
                  <input type="checkbox" checked={selected.includes(entry.id)} onChange={() => toggle(entry.id)} />
                  <span className={styles.optionText}>
                    <strong>{entry.label}</strong>
                    <small>{entry.id}</small>
                    <span className={styles.uniqueOutcomes}>
                      {visibleExpeditionOutcomes(entry, expeditionSettings.minValueToDisplay).slice(0, 3).map((unique) => (
                        <span className={styles.uniqueOutcome} key={unique.name}>
                          <EntityImage alt={unique.label} src={unique.icon} size={36} />
                          <span>{unique.label} <b>{formatChaosValue(unique.chaosValue, locale)}</b></span>
                        </span>
                      ))}
                      {entry.uniques.filter(({ chaosValue, icon }) =>
                        chaosValue > 0 && (chaosValue < expeditionSettings.minValueToDisplay || !icon)
                      ).slice(0, 3).map((unique) => (
                        <span className={styles.cheapOutcome} key={unique.name}>
                          {unique.label} <b>{formatChaosValue(unique.chaosValue, locale)}</b>
                        </span>
                      ))}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : tool === "scarabs" || tool === "runegraft" ? (
            <div className={styles.marketGrid}>
              {visible.map((option) => (
                <label className={styles.marketOption} key={option.id}>
                  <input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} />
                  <EntityImage alt={option.label} src={option.icon} />
                  <span className={styles.optionText}>
                    <span className={styles.marketTitle}>
                      <strong>{option.label}</strong>
                      <b>{option.chaosValue === undefined
                        ? t("regex.workspace.market.priceUnavailable")
                        : formatChaosValue(option.chaosValue, locale)}</b>
                    </span>
                    {option.secondaryLabel && <small>{option.secondaryLabel}</small>}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className={styles.options}>
              {visible.map((option) => (
                <label className={styles.option} key={option.id}>
                  <input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} />
                  {option.icon && <EntityImage alt="" src={option.icon} size={32} />}
                  <span className={styles.optionText}>
                    <span>{option.label}</span>
                    {option.secondaryLabel && <small>{option.secondaryLabel}</small>}
                  </span>
                </label>
              ))}
              {!showAll && filtered.length > visible.length && (
                <button className={styles.showAll} type="button" onClick={() => setShowAll(true)}>
                  {t("regex.workspace.showAll")} ({filtered.length})
                </button>
              )}
            </div>
          )}
        </section>
        <aside className={styles.output} aria-live="polite">
          <div className={styles.outputHeader}>
            <strong>Regex A</strong><span>{result.primary.length}/250</span>
          </div>
          <textarea readOnly value={result.primary} placeholder={t("regex.workspace.empty")} />
          <button type="button" disabled={!result.primary} onClick={() => void copy(result.primary, "A")}>
            {copied === "A" ? t("regex.workspace.copied") : t("regex.workspace.copyA")}
          </button>
          {result.secondary && (
            <>
              <div className={styles.outputHeader}><strong>Regex B</strong><span>{result.secondary.length}/250</span></div>
              <textarea readOnly value={result.secondary} />
              <button type="button" onClick={() => void copy(result.secondary ?? "", "B")}>
                {copied === "B" ? t("regex.workspace.copied") : t("regex.workspace.copyB")}
              </button>
            </>
          )}
          {result.diagnostics.map((diagnostic) => (
            <p className={diagnostic.severity === "blocking" ? styles.error : styles.notice} key={diagnostic.code}>
              {diagnostic.message}
            </p>
          ))}
        </aside>
      </div>
    </main>
  );
}
