import { CopyToClipboard } from "../../CopyToClipboard";
import { InlineFakeBlock } from "../../InlineFakeBlock";
import { ItemReward } from "../../ItemReward";
import { labyrinthLinksById } from "../../../features/labyrinth-links";
import type { MessageKey, MessageParameters } from "../../../i18n/core";
import styles from "./styles.module.css";
import classNames from "classnames";
import { Data, type Fragments, type GameData } from "common";
import React from "react";
import {
  BsArrowDownLeftSquare,
  BsArrowDownRightSquare,
  BsArrowDownSquare,
  BsArrowLeftSquare,
  BsArrowRightSquare,
  BsArrowUpLeftSquare,
  BsArrowUpRightSquare,
  BsArrowUpSquare,
} from "react-icons/bs";

function getImageUrl(path: string) {
  return new URL(`./images/${path}`, import.meta.url).href;
}

function minAreaLevel(areaLevel: number) {
  return Math.max(1, areaLevel - (3 + Math.floor(areaLevel / 16)));
}

function MinAreaLevelComponent(areaLevel: number) {
  return (
    <span className={classNames(styles.areaLevel)}>
      {minAreaLevel(areaLevel)}
      {"+"}
    </span>
  );
}

function EnemyComponent(enemy: string) {
  return <span className={classNames(styles.enemy)}>{enemy}</span>;
}

interface FragmentGameData {
  areaName: (id: string) => string;
  areaMapName: (id: string) => string | null;
  craftingRecipes: (id: string) => string[];
  questName: (id: string) => string;
  rewardNpc: (questId: string, rewardOfferId: string) => string;
  literal: (english: string) => string;
}

export interface FragmentRenderContext {
  game: FragmentGameData;
  t: (key: MessageKey, parameters?: MessageParameters) => string;
}

function AreaComponent(
  areaId: string,
  game: FragmentGameData,
  useMapName = false,
) {
  const area = Data.Areas[areaId];
  const name = useMapName
    ? (game.areaMapName(areaId) ?? game.areaName(areaId))
    : game.areaName(areaId);

  return (
    <div className={classNames(styles.noWrap)}>
      <span className={classNames(styles.area)}>{name}</span>
      {!area.is_town_area && area.level !== undefined && (
        <> {MinAreaLevelComponent(area.level)}</>
      )}
      {area.is_town_area && (
        <img
          src={getImageUrl("town.png")}
          className={classNames("inlineIcon")}
          alt=""
        />
      )}
    </div>
  );
}

function ArenaComponent(name: string) {
  return <span className={classNames(styles.area)}>{name}</span>;
}

function QuestComponent(
  fragment: Fragments.QuestFragment,
  game: FragmentGameData,
) {
  const quest = Data.Quests[fragment.questId];

  const npcs = Array.from(
    new Set(
      fragment.rewardOffers
        .filter((rewardOfferId) => quest.reward_offers[rewardOfferId])
        .map((rewardOfferId) =>
          game.rewardNpc(fragment.questId, rewardOfferId),
        ),
    ),
  );

  return (
    <div className={classNames(styles.noWrap)}>
      <img
        src={getImageUrl("quest.png")}
        className={classNames("inlineIcon")}
        alt=""
      />
      <span className={classNames(styles.quest)}>
        {game.questName(fragment.questId)}
      </span>
      {npcs.length > 0 && (
        <> - {GenericComponent(Array.from(npcs).join(", "))}</>
      )}
    </div>
  );
}

function QuestTextComponent(text: string) {
  return <span className={classNames(styles.questText)}>{text}</span>;
}

function WaypointComponent(label: string) {
  return (
    <div className={classNames(styles.noWrap)}>
      <img
        src={getImageUrl("waypoint.png")}
        className={classNames("inlineIcon")}
        alt=""
      />
      <span className={classNames(styles.waypoint)}>{label}</span>
    </div>
  );
}

function TrialComponent(label: string) {
  return (
    <div className={classNames(styles.noWrap)}>
      <img
        src={getImageUrl("trial.png")}
        className={classNames("inlineIcon")}
        alt=""
      />
      <span className={classNames(styles.trial)}>{label}</span>
    </div>
  );
}

function LogoutComponent(
  areaId: GameData.Area["id"],
  context: FragmentRenderContext,
) {
  return (
    <>
      {GenericComponent(context.t("fragment.logout"))}
      <span> ➞ </span>
      {AreaComponent(areaId, context.game)}
    </>
  );
}

function PortalComponent(
  context: FragmentRenderContext,
  areaId?: GameData.Area["id"],
) {
  return (
    <div className={classNames(styles.noWrap)}>
      <img
        src={getImageUrl("portal.png")}
        className={classNames("inlineIcon")}
        alt=""
      />
      <span className={classNames(styles.portal)}>
        {context.t("fragment.portal")}
      </span>
      {areaId && (
        <>
          <span> ➞ </span>
          {AreaComponent(areaId, context.game)}
        </>
      )}
    </div>
  );
}

const directions = [
  <InlineFakeBlock child={<BsArrowUpSquare />} />,
  <InlineFakeBlock child={<BsArrowUpRightSquare />} />,
  <InlineFakeBlock child={<BsArrowRightSquare />} />,
  <InlineFakeBlock child={<BsArrowDownRightSquare />} />,
  <InlineFakeBlock child={<BsArrowDownSquare />} />,
  <InlineFakeBlock child={<BsArrowDownLeftSquare />} />,
  <InlineFakeBlock child={<BsArrowLeftSquare />} />,
  <InlineFakeBlock child={<BsArrowUpLeftSquare />} />,
];

function DirectionComponent(dirIndex: number) {
  return <span>{directions[dirIndex]}</span>;
}

function GenericComponent(text: string) {
  return <span className={classNames(styles.default)}>{text}</span>;
}

function CraftingComponent(
  craftingRecipes: string[],
  context: FragmentRenderContext,
) {
  return (
    <span>
      <div className={classNames(styles.noWrap)}>
        <img
          src={getImageUrl("crafting.png")}
          className={classNames("inlineIcon")}
          alt=""
        />
        {GenericComponent(`${context.t("fragment.crafting")}: `)}
      </div>
      {GenericComponent(craftingRecipes.join(", "))}
    </span>
  );
}

function AscendComponent(
  version: Fragments.AscendFragment["version"],
  context: FragmentRenderContext,
): [React.ReactNode, React.ReactNode] {
  const { url, areaId } = labyrinthLinksById[version];
  const area = Data.Areas[areaId];
  return [
    <div className={classNames(styles.noWrap)}>
      <img
        src={getImageUrl("trial.png")}
        className={classNames("inlineIcon")}
        alt=""
      />
      <span className={classNames(styles.trial)}>
        {context.t("fragment.ascend")}
      </span>
      <> {MinAreaLevelComponent(area.level)}</>
    </div>,
    <a
      href={url}
      target="_blank"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {context.t("fragment.dailyLayout")}
    </a>,
  ];
}

export function Fragment(
  fragment: Fragments.AnyFragment,
  context: FragmentRenderContext,
): [React.ReactNode, React.ReactNode] {
  if (typeof fragment === "string") return [<>{fragment}</>, null];

  switch (fragment.type) {
    case "kill":
      return [EnemyComponent(context.game.literal(fragment.value)), null];
    case "arena":
      return [ArenaComponent(fragment.value), null];
    case "area":
      return [AreaComponent(fragment.areaId, context.game), null];
    case "enter":
      return [AreaComponent(fragment.areaId, context.game), null];
    case "logout":
      return [LogoutComponent(fragment.areaId, context), null];
    case "waypoint":
      return [WaypointComponent(context.t("fragment.waypoint")), null];
    case "waypoint_use": {
      const dstArea = Data.Areas[fragment.dstAreaId];
      const srcArea = Data.Areas[fragment.srcAreaId];
      return [
        <>
          {WaypointComponent(context.t("fragment.waypoint"))}
          <span> ➞ </span>
          {AreaComponent(fragment.dstAreaId, context.game, true)}
          {dstArea.act !== srcArea.act &&
            dstArea.id !== "Labyrinth_Airlock" && (
              <>
                {" "}
                -{" "}
                {GenericComponent(
                  context.t("fragment.act", { act: dstArea.act }),
                )}
              </>
            )}
        </>,
        null,
      ];
    }
    case "waypoint_get":
      return [WaypointComponent(context.t("fragment.waypoint")), null];
    case "portal_use":
      return [PortalComponent(context, fragment.dstAreaId), null];
    case "portal_set":
      return [PortalComponent(context), null];
    case "quest":
      return [QuestComponent(fragment, context.game), null];
    case "quest_text":
      return [QuestTextComponent(fragment.value), null];
    case "generic":
      return [GenericComponent(fragment.value), null];
    case "reward_quest":
      return [<ItemReward item={fragment.item} rewardType="quest" />, null];
    case "reward_vendor":
      return [
        <ItemReward
          item={fragment.item}
          cost={fragment.cost}
          rewardType="vendor"
        />,
        null,
      ];
    case "trial":
      return [TrialComponent(context.t("fragment.trial")), null];
    case "ascend":
      return AscendComponent(fragment.version, context);
    case "crafting":
      return [
        CraftingComponent(
          fragment.areaId
            ? context.game.craftingRecipes(fragment.areaId)
            : fragment.crafting_recipes,
          context,
        ),
        null,
      ];
    case "dir":
      return [DirectionComponent(fragment.dirIndex), null];
    case "copy":
      let output: [React.ReactNode | null, React.ReactNode | null] = [
        null,
        null,
      ];

      const node = <CopyToClipboard text={fragment.text} />;
      switch (fragment.side) {
        case "head":
          output[0] = node;
          break;
        case "tail":
          output[1] = node;
          break;
      }

      return output;
  }

  return [<>{`unmapped: ${JSON.stringify(fragment)}`}</>, null];
}
