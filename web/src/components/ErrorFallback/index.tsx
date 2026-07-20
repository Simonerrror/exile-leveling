import styles from "./styles.module.css";
import { useI18n } from "../../i18n";
import classNames from "classnames";
import { type FallbackProps } from "react-error-boundary";

export function ErrorFallback({}: FallbackProps) {
  const { t } = useI18n();

  return (
    <span>
      {t("error.prefix")}
      <span
        className={classNames(styles.reset)}
        onClick={() => {
          localStorage.clear();
          location.reload();
        }}
      >
        {t("error.link")}
      </span>
      {t("error.suffix")}
    </span>
  );
}
