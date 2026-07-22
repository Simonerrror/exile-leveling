import { useI18n } from "../../../i18n";
import type { MessageKey } from "../../../i18n/core";
import type { MapRegexSettings } from "../core/maps";
import {
  applyMapFlagMode,
  mapFlagMode,
  mapModMode,
  setMapModMode,
  toggleMapRarity,
  type MapFlagMode,
  type MapModMode,
} from "./map-editor-state";
import styles from "./MapEditor.module.css";

export interface MapEditorOption {
  id: string;
  label: string;
  nightmare?: boolean;
}

interface MapEditorProps {
  options: MapEditorOption[];
  query: string;
  reset: () => void;
  setQuery: (value: string) => void;
  settings: MapRegexSettings;
  update: (settings: MapRegexSettings) => void;
}

const thresholdFields = [
  ["quantity", "regex.workspace.maps.quantity"],
  ["packsize", "regex.workspace.maps.packsize"],
  ["itemRarity", "regex.workspace.maps.itemRarity"],
  ["mapDropChance", "regex.workspace.maps.mapDropChance"],
] as const;

const qualityFields = ["regular", "currency", "divination", "rarity", "packSize", "scarab"] as const;
const rarityKeys = ["normal", "magic", "rare"] as const;
const flagModes: MapFlagMode[] = ["any", "only", "exclude"];
const modModes: MapModMode[] = ["ignore", "exclude", "require"];

export function MapEditor({ options, query, reset, setQuery, settings, update }: MapEditorProps) {
  const { t } = useI18n();
  const needle = query.trim().toLocaleLowerCase();
  const filtered = options.filter(({ label }) => needle === "" || label.toLocaleLowerCase().includes(needle));
  const availableIds = new Set(options.map(({ id }) => Number(id)));
  const selectedCount = [...settings.badIds, ...settings.goodIds]
    .filter((id) => availableIds.has(id)).length;

  const setFlagMode = (key: "corrupted" | "unidentified", mode: MapFlagMode) => update({
    ...settings,
    [key]: applyMapFlagMode(settings[key], mode),
  });

  return (
    <div className={styles.editor}>
      <div className={styles.panels}>
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <p>{t("regex.workspace.maps.mapRules")}</p>
              <h2>{t("regex.workspace.maps.thresholds")}</h2>
            </div>
          </header>
          <div className={styles.numberGrid}>
            {thresholdFields.map(([key, label]) => (
              <label className={styles.numberField} key={key}>
                <span>{t(label)}</span>
                <span className={styles.numberInput}>
                  <input
                    min="0"
                    inputMode="numeric"
                    type="number"
                    value={settings[key]}
                    onChange={(event) => update({ ...settings, [key]: event.target.value })}
                  />
                  <b>%</b>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.qualityPanel}`}>
          <header className={styles.panelHeader}>
            <div>
              <p>{t("regex.workspace.maps.mapRules")}</p>
              <h2>{t("regex.workspace.maps.qualityRewards")}</h2>
            </div>
            <div className={styles.modeSwitch} aria-label={t("regex.workspace.maps.qualityMode")}>
              <button
                aria-pressed={settings.anyQuality}
                type="button"
                onClick={() => update({ ...settings, anyQuality: true })}
              >{t("regex.workspace.maps.qualityAny")}</button>
              <button
                aria-pressed={!settings.anyQuality}
                type="button"
                onClick={() => update({ ...settings, anyQuality: false })}
              >{t("regex.workspace.maps.qualityAll")}</button>
            </div>
          </header>
          <p className={styles.modeHelp}>{t(settings.anyQuality
            ? "regex.workspace.maps.qualityAnyHelp"
            : "regex.workspace.maps.qualityAllHelp")}</p>
          <div className={styles.numberGrid}>
            {qualityFields.map((key) => (
              <label className={styles.numberField} key={key}>
                <span>{t(`regex.workspace.maps.quality.${key}` as MessageKey)}</span>
                <span className={styles.numberInput}>
                  <input
                    min="0"
                    inputMode="numeric"
                    type="number"
                    value={settings.quality[key]}
                    onChange={(event) => update({
                      ...settings,
                      quality: { ...settings.quality, [key]: event.target.value },
                    })}
                  />
                  <b>%</b>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.formatPanel}>
        <div className={styles.formatGroup}>
          <strong>{t("regex.workspace.maps.rarity")}</strong>
          <div className={styles.chips}>
            {rarityKeys.map((key) => (
              <button
                aria-pressed={settings.rarity[key]}
                key={key}
                type="button"
                onClick={() => update({ ...settings, rarity: toggleMapRarity(settings.rarity, key) })}
              >{t(`regex.workspace.maps.rarity.${key}` as MessageKey)}</button>
            ))}
          </div>
        </div>
        {(["corrupted", "unidentified"] as const).map((key) => (
          <fieldset className={styles.formatGroup} key={key}>
            <legend>{t(`regex.workspace.maps.${key}` as MessageKey)}</legend>
            <div className={styles.chips}>
              {flagModes.map((mode) => (
                <button
                  aria-pressed={mapFlagMode(settings[key]) === mode}
                  key={mode}
                  type="button"
                  onClick={() => setFlagMode(key, mode)}
                >{t(`regex.workspace.maps.flag.${mode}` as MessageKey)}</button>
              ))}
            </div>
          </fieldset>
        ))}
      </section>

      <section className={styles.modsPanel}>
        <header className={styles.modsHeader}>
          <div>
            <h2>{t("regex.workspace.maps.modifiers")}</h2>
            <span>{t("regex.workspace.selected")}: {selectedCount}</span>
          </div>
          <label className={styles.search}>
            <span>{t("regex.workspace.search")}</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <label className={styles.nightmareToggle}>
            <input
              type="checkbox"
              checked={settings.displayNightmareMods}
              onChange={() => update({ ...settings, displayNightmareMods: !settings.displayNightmareMods })}
            />
            <span>{t("regex.workspace.maps.nightmare")}</span>
          </label>
          <div className={styles.requiredMode}>
            <span>{t("regex.workspace.maps.requiredMode")}</span>
            <div className={styles.modeSwitch}>
              <button aria-pressed={!settings.allGoodMods} type="button" onClick={() => update({ ...settings, allGoodMods: false })}>
                {t("regex.workspace.maps.qualityAny")}
              </button>
              <button aria-pressed={settings.allGoodMods} type="button" onClick={() => update({ ...settings, allGoodMods: true })}>
                {t("regex.workspace.maps.qualityAll")}
              </button>
            </div>
          </div>
          <button className={styles.reset} type="button" onClick={reset}>{t("regex.workspace.reset")}</button>
        </header>

        <div className={styles.modGrid}>
          {filtered.map((option) => {
            const id = Number(option.id);
            const activeMode = mapModMode(settings, id);
            return (
              <article className={styles.modCard} data-mode={activeMode} key={option.id}>
                <div className={styles.modTitle}>
                  <span>{option.label}</span>
                  {option.nightmare && <b>{t("regex.workspace.maps.nightmareBadge")}</b>}
                </div>
                <div className={styles.modModes}>
                  {modModes.map((mode) => (
                    <button
                      aria-pressed={activeMode === mode}
                      key={mode}
                      type="button"
                      onClick={() => update(setMapModMode(settings, id, mode))}
                    >{t(`regex.workspace.maps.mode.${mode}` as MessageKey)}</button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && <p className={styles.empty}>{t("regex.workspace.noResults")}</p>}
      </section>

      <details className={styles.custom}>
        <summary>{t("regex.workspace.maps.custom")}</summary>
        <label>
          <span>{t("regex.workspace.maps.customHelp")}</span>
          <input
            value={settings.customText.value}
            onChange={(event) => update({
              ...settings,
              customText: { enabled: true, value: event.target.value },
            })}
          />
        </label>
      </details>
    </div>
  );
}
