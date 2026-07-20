import { SplitRow } from "../SplitRow";
import { useGameData, useI18n } from "../../i18n";
import styles from "./styles.module.css";
import classNames from "classnames";
import type { RouteData } from "common";

interface BuildInfoFormProps {
  buildData: RouteData.BuildData;
  onSubmit: (buildData: RouteData.BuildData) => void;
}

export function BuildInfoForm({ buildData, onSubmit }: BuildInfoFormProps) {
  const game = useGameData();
  const { t } = useI18n();

  return (
    <div className={classNames(styles.form)}>
      <SplitRow
        left={
          <div className={classNames(styles.label)}>{t("build.class")}</div>
        }
        right={
          <div className={classNames(styles.value)}>
            {buildData.characterClass === "None"
              ? t("build.noClass")
              : game.className(buildData.characterClass)}
          </div>
        }
      />
      <SplitRow
        left={
          <div className={classNames(styles.label)}>{t("build.bandits")}</div>
        }
        right={
          <div className={classNames(styles.value)}>
            {buildData.bandit == "None"
              ? t("build.killAll")
              : game.literal(buildData.bandit)}
          </div>
        }
      />
      <SplitRow
        left={
          <div className={classNames(styles.label)}>
            {t("build.leagueStart")}
          </div>
        }
        right={
          <div className={classNames(styles.value)}>
            <input
              type="checkbox"
              checked={buildData.leagueStart}
              onChange={(evt) => {
                onSubmit({
                  ...buildData,
                  leagueStart: evt.target.checked,
                });
              }}
              aria-label={t("build.leagueStart")}
            />
          </div>
        }
      />
      <SplitRow
        left={
          <div className={classNames(styles.label)}>{t("build.library")}</div>
        }
        right={
          <div className={classNames(styles.value)}>
            <input
              type="checkbox"
              checked={buildData.library}
              onChange={(evt) => {
                onSubmit({
                  ...buildData,
                  library: evt.target.checked,
                });
              }}
              aria-label={t("build.library")}
            />
          </div>
        }
      />
    </div>
  );
}
