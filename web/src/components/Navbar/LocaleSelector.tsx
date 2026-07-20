import classNames from "classnames";
import { useAtom } from "jotai";
import { useI18n } from "../../i18n";
import { localeAtom } from "../../state/locale";
import { interactiveStyles } from "../../styles";
import styles from "./styles.module.css";

const LOCALES = ["en", "ru"] as const;

export function LocaleSelector() {
  const [locale, setLocale] = useAtom(localeAtom);
  const { t } = useI18n();

  return (
    <div
      className={styles.localeSelector}
      role="group"
      aria-label={t("nav.language")}
    >
      {LOCALES.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={locale === value}
          className={classNames(styles.localeButton, {
            [interactiveStyles.activePrimary]: locale === value,
            [interactiveStyles.hoverPrimary]: locale !== value,
          })}
          onClick={() => setLocale(value)}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
