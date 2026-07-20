import { Data, type LocalizedGameData } from "common";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { localeAtom } from "../state/locale";
import type { Locale } from "./core";

export type LocalizedNameMap = Readonly<Record<string, string | undefined>>;

export function localizedName(
  id: string,
  english: string | undefined,
  names: LocalizedNameMap,
): string {
  return names[id] ?? english ?? id;
}

interface CanonicalData {
  Gems: Record<string, { name: string }>;
  Areas: Record<string, { name: string; map_name: string | null }>;
  Quests: Record<
    string,
    {
      name: string;
      reward_offers: Partial<
        Record<
          string,
          {
            quest_npc: string;
            vendor: Partial<Record<string, { npc: string }>>;
          }
        >
      >;
    }
  >;
  Characters: Record<string, unknown>;
}

interface LocalizedData {
  gems: Record<string, string>;
  areas: Record<string, { name: string; mapName: string | null }>;
  quests: Record<
    string,
    {
      name: string;
      rewardNpcs: Record<string, string>;
      vendorNpcs: Record<string, Record<string, string>>;
    }
  >;
  classes: Record<string, string>;
  literals: Record<string, string>;
}

export function createGameData(
  locale: "en" | "ru",
  canonical: CanonicalData,
  localized: LocalizedData,
) {
  const names = <T extends LocalizedNameMap>(
    russian: T,
  ): T | LocalizedNameMap => (locale === "ru" ? russian : {});

  return {
    gemName: (id: string) =>
      localizedName(id, canonical.Gems[id]?.name, names(localized.gems)),
    areaName: (id: string) => {
      const english = canonical.Areas[id]?.name;
      return locale === "ru"
        ? (localized.areas[id]?.name ?? english ?? id)
        : (english ?? id);
    },
    areaMapName: (id: string): string | null => {
      const english = canonical.Areas[id]?.map_name;
      if (english === null) return null;
      if (locale === "ru") return localized.areas[id]?.mapName || english || id;
      return english || id;
    },
    questName: (id: string) => {
      const english = canonical.Quests[id]?.name;
      return locale === "ru"
        ? (localized.quests[id]?.name ?? english ?? id)
        : (english ?? id);
    },
    className: (id: string) =>
      localizedName(
        id,
        Object.hasOwn(canonical.Characters, id) ? id : undefined,
        names(localized.classes),
      ),
    rewardNpc: (questId: string, rewardOfferId: string) =>
      localizedName(
        rewardOfferId,
        canonical.Quests[questId]?.reward_offers[rewardOfferId]?.quest_npc,
        names(localized.quests[questId]?.rewardNpcs ?? {}),
      ),
    vendorNpc: (questId: string, rewardOfferId: string, gemId: string) =>
      localizedName(
        gemId,
        canonical.Quests[questId]?.reward_offers[rewardOfferId]?.vendor[gemId]
          ?.npc,
        names(localized.quests[questId]?.vendorNpcs[rewardOfferId] ?? {}),
      ),
    literal: (english: string) =>
      locale === "ru" ? localized.literals[english] || english : english,
  };
}

const gameDataByLocale = {
  en: createGameData("en", Data, Data.Localized.ru as LocalizedGameData.Data),
  ru: createGameData("ru", Data, Data.Localized.ru as LocalizedGameData.Data),
};

export function gameDataForLocale(locale: Locale) {
  return gameDataByLocale[locale];
}

export const gemName = (locale: Locale, id: string) =>
  gameDataForLocale(locale).gemName(id);
export const areaName = (locale: Locale, id: string) =>
  gameDataForLocale(locale).areaName(id);
export const areaMapName = (locale: Locale, id: string) =>
  gameDataForLocale(locale).areaMapName(id);
export const questName = (locale: Locale, id: string) =>
  gameDataForLocale(locale).questName(id);
export const className = (locale: Locale, id: string) =>
  gameDataForLocale(locale).className(id);
export const rewardNpc = (
  locale: Locale,
  questId: string,
  rewardOfferId: string,
) => gameDataForLocale(locale).rewardNpc(questId, rewardOfferId);
export const vendorNpc = (
  locale: Locale,
  questId: string,
  rewardOfferId: string,
  gemId: string,
) => gameDataForLocale(locale).vendorNpc(questId, rewardOfferId, gemId);
export const literal = (locale: Locale, english: string) =>
  gameDataForLocale(locale).literal(english);

export function buildGemSearchString(
  locale: Locale,
  gemIds: readonly string[],
): string {
  if (gemIds.length === 0) return "";
  return `"${gemIds.map((id) => gemName(locale, id)).join("|")}"`;
}

export function useGameData() {
  const locale = useAtomValue(localeAtom);
  return useMemo(() => gameDataForLocale(locale), [locale]);
}
