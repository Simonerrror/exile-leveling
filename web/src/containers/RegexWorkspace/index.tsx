import { useEffect, useMemo, useState } from "react";
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
} from "../../features/regex/core/content";
import { compileFlaskRegex } from "../../features/regex/core/flasks";
import { compileItemRegex } from "../../features/regex/core/items";
import { groupVendorGems } from "../../features/regex/vendor-gem-catalog";
import { heistContractLabels } from "../../features/regex/heist-contract-labels";
import {
  defaultExpeditionSettings,
  expeditionCatalog,
  formatChaosValue,
  normalizeExpeditionSettings,
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
        return { id, label: translatedLabel(id, entry, value.translations) };
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
        .filter((entry) => selected.includes(valueText(entry, "beast") ?? ""))
        .map((entry) => ({ ...(entry as object), chaosValue: 1 }));
      return compilePricedBeastRegex(entries, { includeHarvest: true, redOnly: false }, value.translations);
    }
    case "tattoo": {
      const value = data as EntriesRegexData;
      const entries = (Array.isArray(value.entries) ? value.entries : [])
        .filter((entry) => selected.includes(valueText(entry, "tattoo") ?? ""))
        .map((entry) => ({ ...(entry as object), chaosValue: 1 }));
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
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState<"A" | "B" | null>(null);

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
    setQuery("");
    loadRegexData(dataToolByRoute[tool], locale).then((value) => {
      if (active) setLoaded({ tool, locale, value });
    });
    return () => { active = false; };
  }, [locale, tool]);

  const options = useMemo(() => tool && data ? optionsFor(tool, data) : [], [data, tool]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return options.filter(({ label, secondaryLabel }) => needle === "" ||
      `${label} ${secondaryLabel ?? ""}`.toLocaleLowerCase().includes(needle));
  }, [options, query]);
  const visible = showAll ? filtered : filtered.slice(0, 160);
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
  const result = useMemo(() => {
    if (!tool || !data) return emptyResult;
    if (tool === "expedition") {
      return compileExpeditionRegex(selected, expeditionFillers, data as ExpeditionRegexData);
    }
    return compile(tool, data, selected, vendorSettings, flaskSettings, locale);
  }, [data, expeditionFillers, flaskSettings, locale, selected, tool, vendorSettings]);

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
    if (tool === "expedition") updateExpedition(nextExpedition);
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
          {(tool === "scarabs" || tool === "runegraft") && data !== null && (
            <p className={styles.economyMeta}>
              {t("regex.workspace.expedition.economy", {
                league: (data as PricedEntriesRegexData).priceLeague,
                date: new Intl.DateTimeFormat(locale).format(new Date((data as PricedEntriesRegexData).priceUpdatedAt)),
              })}
            </p>
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
          ) : tool === "expedition" ? (
            <div className={styles.expeditionGrid}>
              {expeditionEntries.map((entry) => (
                <label className={styles.expeditionOption} key={entry.id}>
                  <input type="checkbox" checked={selected.includes(entry.id)} onChange={() => toggle(entry.id)} />
                  <span className={styles.optionText}>
                    <strong>{entry.label}</strong>
                    <small>{entry.id}</small>
                    <span className={styles.uniqueOutcomes}>
                      {entry.uniques.filter(({ chaosValue }) => chaosValue > 0).slice(0, 3).map((unique) => (
                        <span key={unique.name}>{unique.label} <b>{formatChaosValue(unique.chaosValue, locale)}</b></span>
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
                      <b>{option.chaosValue === undefined ? "—" : formatChaosValue(option.chaosValue, locale)}</b>
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
