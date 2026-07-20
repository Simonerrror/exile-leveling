import { CopyToClipboard } from "../CopyToClipboard";
import { useGameData, useI18n } from "../../i18n";
import { GemCost } from "../GemCost";
import { InlineFakeBlock } from "../InlineFakeBlock";
import { SplitRow } from "../SplitRow";
import styles from "./styles.module.css";
import classNames from "classnames";
import { Data, type RouteData } from "common";
import type { ReactNode } from "react";
import { MdCircle } from "react-icons/md";

interface ItemRewardProps {
  item: string;
  count?: number;
  rewardType?: "quest" | "vendor";
  cost?: ReactNode;
}

export function ItemReward({ item, count, cost, rewardType }: ItemRewardProps) {
  const { t } = useI18n();
  const verb =
    rewardType === "quest"
      ? t("reward.take")
      : rewardType === "vendor"
        ? t("reward.buy")
        : null;

  return (
    <>
      {verb !== null && <span>{verb} </span>}
      <span className={classNames(styles.default)}>{item}</span>
      {count && count > 1 && <span> x{count}</span>}
      {rewardType === "vendor" && cost !== undefined && (
        <div className={classNames(styles.noWrap)}>
          <span> {t("reward.for")} </span>
          <InlineFakeBlock child={cost} />
        </div>
      )}
    </>
  );
}

interface GemRewardProps {
  requiredGem: RouteData.RequiredGem;
  count: number;
  rewardType?: ItemRewardProps["rewardType"];
}

export function GemReward({ requiredGem, count, rewardType }: GemRewardProps) {
  const gem = Data.Gems[requiredGem.id];
  const game = useGameData();
  const { t } = useI18n();

  if (!gem)
    return (
      <div className={classNames(styles.gemError)}>
        {t("reward.missingGem", { gem: requiredGem.id })}
      </div>
    );

  return (
    <SplitRow
      left={
        <>
          <MdCircle
            color={Data.GemColours[gem.primary_attribute]}
            className={classNames("inlineIcon")}
          />
          <ItemReward
            item={game.gemName(requiredGem.id)}
            cost={<GemCost gem={gem} />}
            rewardType={rewardType}
            count={count}
          />
        </>
      }
      right={
        <div className={classNames(styles.rewardNote)}>
          {requiredGem.note}{" "}
          <CopyToClipboard text={game.gemName(requiredGem.id)} />
        </div>
      }
    />
  );
}
