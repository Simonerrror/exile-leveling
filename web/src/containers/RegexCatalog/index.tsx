import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n/core";
import { loadRegexData } from "../../features/regex/data/loaders";
import beastIcon from "./images/regex-tool-beast.png";
import expeditionIcon from "./images/regex-tool-expedition.png";
import flasksIcon from "./images/regex-tool-flasks.png";
import heistIcon from "./images/regex-tool-heist.png";
import itemsIcon from "./images/regex-tool-items.png";
import jewelsIcon from "./images/regex-tool-jewels.png";
import mapnamesIcon from "./images/regex-tool-mapnames.png";
import mapsIcon from "./images/regex-tool-maps.png";
import runegraftIcon from "./images/regex-tool-runegraft.png";
import scarabsIcon from "./images/regex-tool-scarabs.png";
import tattooIcon from "./images/regex-tool-tattoo.png";
import vendorIcon from "./images/regex-tool-vendor.png";
import styles from "./styles.module.css";

export const regexToolIds = [
  "vendor",
  "maps",
  "items",
  "mapnames",
  "expedition",
  "heist",
  "flasks",
  "beast",
  "tattoo",
  "runegraft",
  "scarabs",
  "jewels",
] as const;

const regexToolIcons = {
  vendor: vendorIcon,
  maps: mapsIcon,
  items: itemsIcon,
  mapnames: mapnamesIcon,
  expedition: expeditionIcon,
  heist: heistIcon,
  flasks: flasksIcon,
  beast: beastIcon,
  tattoo: tattooIcon,
  runegraft: runegraftIcon,
  scarabs: scarabsIcon,
  jewels: jewelsIcon,
};

export default function RegexCatalog() {
  const { locale, t } = useI18n();

  useEffect(() => {
    const preload = () => { void loadRegexData("mapnames", locale); };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preload, { timeout: 1_500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(preload, 250);
    return () => globalThis.clearTimeout(id);
  }, [locale]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>PoE Tools</p>
          <h1>{t("regex.catalog.title")}</h1>
          <p>{t("regex.catalog.description")}</p>
        </div>
        <Link className={styles.backLink} to="/">
          {t("regex.catalog.back")}
        </Link>
      </header>
      <section className={styles.grid} aria-label={t("regex.catalog.title")}>
        {regexToolIds.map((id) => {
          return (
            <Link
              className={styles.tool}
              key={id}
              onFocus={() => { if (id === "mapnames") void loadRegexData("mapnames", locale); }}
              onPointerEnter={() => { if (id === "mapnames") void loadRegexData("mapnames", locale); }}
              to={`/regex/${id}`}
            >
              <img
                alt=""
                aria-hidden={true}
                className={styles.toolIcon}
                decoding="async"
                loading="lazy"
                src={regexToolIcons[id]}
              />
              <strong>{t(`regex.tool.${id}` as MessageKey)}</strong>
              <span>{t("regex.catalog.open")}</span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
