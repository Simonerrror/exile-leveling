import { useAtomValue } from "jotai";
import { useCallback } from "react";
import { localeAtom } from "../state/locale";
import { translate, type MessageKey, type MessageParameters } from "./core";

export function useI18n() {
  const locale = useAtomValue(localeAtom);
  const t = useCallback(
    (key: MessageKey, parameters?: MessageParameters) =>
      translate(locale, key, parameters),
    [locale],
  );

  return { locale, t };
}
