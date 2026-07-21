import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n/core";
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

export default function RegexCatalog() {
  const { t } = useI18n();

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
        {regexToolIds.map((id) => (
          <Link className={styles.tool} key={id} to={`/regex/${id}`}>
            <strong>{t(`regex.tool.${id}` as MessageKey)}</strong>
            <span>{t("regex.catalog.open")}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
