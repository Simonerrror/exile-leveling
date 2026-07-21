import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { RegexLocale } from "../core/types.js";

export const regexEditorToolIds = [
  "vendor", "maps", "items", "expedition", "heist", "flasks",
  "beast", "tattoo", "runegraft", "scarabs", "jewels",
] as const;

export type RegexEditorToolId = (typeof regexEditorToolIds)[number];

export interface RegexEditorProps<Data, Settings> {
  data: Data;
  locale: RegexLocale;
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  children?: ReactNode;
}
