import type { Config } from "../../state/config";
import { useI18n } from "../../i18n";
import { SplitRow } from "../SplitRow";
import styles from "./styles.module.css";
import classNames from "classnames";

interface ConfigFormProps {
  config: Config;
  onSubmit: (config: Config) => void;
}

export function ConfigForm({ config, onSubmit }: ConfigFormProps) {
  const { t } = useI18n();

  return (
    <div className={classNames(styles.form)}>
      <SplitRow
        left={
          <div className={classNames(styles.label)}>{t("config.gemsOnly")}</div>
        }
        right={
          <div className={classNames(styles.value)}>
            <input
              type="checkbox"
              checked={config.gemsOnly}
              onChange={(evt) => {
                onSubmit({
                  ...config,
                  gemsOnly: evt.target.checked,
                });
              }}
              aria-label={t("config.gemsOnly")}
            />
          </div>
        }
      />
      <SplitRow
        left={
          <div className={classNames(styles.label)}>
            {t("config.showAllHints")}
          </div>
        }
        right={
          <div className={classNames(styles.value)}>
            <input
              type="checkbox"
              checked={config.showSubsteps}
              onChange={(evt) => {
                onSubmit({
                  ...config,
                  showSubsteps: evt.target.checked,
                });
              }}
              aria-label={t("config.showAllHints")}
            />
          </div>
        }
      />
    </div>
  );
}
