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
  MapNameRegexData,
  MapRegexData,
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
  compileMapNameRegex,
  compilePricedBeastRegex,
  compilePricedTattooRegex,
  compileRunegraftRegex,
  compileScarabRegex,
} from "../../features/regex/core/content";
import { compileFlaskRegex } from "../../features/regex/core/flasks";
import { compileItemRegex } from "../../features/regex/core/items";
import {
  createDefaultToolSettings,
  normalizeVendorSettings,
  type JsonObject,
  type LinkCount,
  type RegexProfileStore,
  type RegexToolProfileSettings,
  type VendorProfileSettings,
} from "../../features/regex/profile/schema";
import { loadProfileStore, saveProfileStore } from "../../features/regex/profile/storage";
import type { RegexCompileResult } from "../../features/regex/core/types";
import styles from "./styles.module.css";

const toolIds = [
  "vendor", "maps", "items", "mapnames", "expedition", "heist",
  "flasks", "beast", "tattoo", "runegraft", "scarabs", "jewels",
] as const;
type ToolId = (typeof toolIds)[number];

const dataToolByRoute: Record<ToolId, RegexDataToolId> = {
  vendor: "vendor", maps: "maps", items: "items", mapnames: "mapnames",
  expedition: "expedition", heist: "heist", flasks: "flasks", beast: "beast",
  tattoo: "tattoos", runegraft: "runegrafts", scarabs: "scarabs", jewels: "jewels",
};

const profileToolByRoute: Record<ToolId, keyof RegexToolProfileSettings> = {
  vendor: "vendor", maps: "maps", items: "items", mapnames: "mapnames",
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

interface Option { id: string; label: string; pattern?: string }
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
    case "mapnames": {
      const value = data as MapNameRegexData;
      return Object.entries(value.entries).map(([id, entry]) => ({ id, label: translatedLabel(id, entry, value.translations) }));
    }
    case "expedition": {
      const value = data as ExpeditionRegexData;
      const translations = isRecord(value.translations.bases) ? value.translations.bases : {};
      return Object.entries(value.baseTypeRegex).map(([id, entry]) => ({ id, label: translatedLabel(id, entry, translations) }));
    }
    case "heist": {
      const value = data as HeistRegexData;
      const translations = isRecord(value.translations.contractTypes) ? value.translations.contractTypes : {};
      return Object.entries(value.contractTypes).map(([id, entry]) => ({ id, label: translatedLabel(id, entry, translations) }));
    }
    case "flasks": {
      const value = data as FlaskRegexData;
      const localized = Array.isArray(value.translations.prefix) ? value.translations.prefix : value.prefix;
      return localized.map((entry, index) => ({
        id: valueText(entry, "description") ?? String(index),
        label: valueText(entry, "description") ?? `#${index + 1}`,
      }));
    }
    case "scarabs": {
      const value = data as EntriesRegexData;
      const entries = isRecord(value.entries) ? value.entries : {};
      return Object.entries(entries).map(([id, entry]) => ({ id, label: translatedLabel(id, entry, value.translations) }));
    }
    case "beast":
    case "tattoo":
    case "runegraft": {
      const value = data as EntriesRegexData;
      const entries = Array.isArray(value.entries) ? value.entries : [];
      const key = tool === "beast" ? "beast" : tool === "tattoo" ? "tattoo" : "runegraft";
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
    case "mapnames": return compileMapNameRegex(selected, false, data as MapNameRegexData);
    case "expedition": return compileExpeditionRegex(selected, [], data as ExpeditionRegexData);
    case "heist": return compileHeistRegex(selected.map((name) => ({ name, start: 1, end: 1 })), 0, false, data as HeistRegexData);
    case "flasks": return compileFlaskRegex({
      selectedPrefix: selected, selectedSuffix: [], itemLevel: 85,
      onlyMaxPrefix: false, onlyMaxSuffix: false, requireBoth: true,
      matchOpenAffix: true, ignoreEffectTiers: false,
    }, data as FlaskRegexData, locale);
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
  const settings = profile.tools[profileToolByRoute[tool]] as JsonObject;
  const fallbackKey: Partial<Record<ToolId, string>> = {
    maps: "badIds", mapnames: "selected", expedition: "selectedBaseTypes",
    heist: "contractLevels", flasks: "selectedPrefix", scarabs: "selected",
    jewels: "selectedRegular",
  };
  const value = settings.selected ?? settings[fallbackKey[tool] ?? ""];
  return Array.isArray(value)
    ? value.filter((entry): entry is string | number => typeof entry === "string" || typeof entry === "number").map(String)
    : [];
}

export default function RegexWorkspace() {
  const { toolId } = useParams();
  const { locale, t } = useI18n();
  const tool = toolIds.includes(toolId as ToolId) ? toolId as ToolId : null;
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
    setQuery("");
    loadRegexData(dataToolByRoute[tool], locale).then((value) => {
      if (active) setLoaded({ tool, locale, value });
    });
    return () => { active = false; };
  }, [locale, tool]);

  const options = useMemo(() => tool && data ? optionsFor(tool, data) : [], [data, tool]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return options.filter(({ label }) => needle === "" || label.toLocaleLowerCase().includes(needle));
  }, [options, query]);
  const visible = showAll ? filtered : filtered.slice(0, 160);
  const result = useMemo(
    () => tool && data ? compile(tool, data, selected, vendorSettings, locale) : emptyResult,
    [data, locale, selected, tool, vendorSettings],
  );

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
    } else {
      const key = profileToolByRoute[tool] as Exclude<keyof RegexToolProfileSettings, "vendor">;
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
  const toggleVendorGroup = (group: VendorBooleanGroup, key: string) => {
    const values = vendorSettings[group] as Record<string, boolean>;
    updateVendor({
      ...vendorSettings,
      [group]: { ...values, [key]: !values[key] },
    } as VendorProfileSettings);
  };
  const reset = () => {
    const nextVendor = createDefaultToolSettings().vendor;
    setSelected([]);
    setVendorSettings(nextVendor);
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
          <label className={styles.search}>
            <span>{t("regex.workspace.search")}</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className={styles.summary}>
            <span>{t("regex.workspace.selected")}: {selected.length}</span>
            <button type="button" onClick={reset}>
              {t("regex.workspace.reset")}
            </button>
          </div>
          {data === null ? <p>{t("regex.workspace.loading")}</p> : (
            <div className={styles.options}>
              {visible.map((option) => (
                <label className={styles.option} key={option.id}>
                  <input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} />
                  <span>{option.label}</span>
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
