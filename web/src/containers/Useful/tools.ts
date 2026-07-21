import type { MessageKey } from "../../i18n/core";

const waypointIcon = new URL(
  "../../components/FragmentStep/Fragment/images/waypoint.png",
  import.meta.url,
).href;
const wisdomIcon = new URL(
  "../../components/GemCost/images/wisdom.png",
  import.meta.url,
).href;
export type InternalToolId = "leveling" | "regex";
export type InternalToolCategoryId = "tools";

export type InternalTool = Readonly<{
  id: InternalToolId;
  href: string;
  category: InternalToolCategoryId;
  accent: "planning" | "regex";
  icon: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  keywordsKey: MessageKey;
}>;

export const internalTools = [
  {
    id: "leveling",
    href: "/leveling",
    category: "tools",
    accent: "planning",
    icon: waypointIcon,
    titleKey: "tools.leveling.title",
    descriptionKey: "tools.leveling.description",
    keywordsKey: "tools.leveling.keywords",
  },
  {
    id: "regex",
    href: "/regex",
    category: "tools",
    accent: "regex",
    icon: wisdomIcon,
    titleKey: "tools.regex.title",
    descriptionKey: "tools.regex.description",
    keywordsKey: "tools.regex.keywords",
  },
] as const satisfies readonly InternalTool[];

export const internalToolCategories = [
  { id: "tools", titleKey: "tools.category.tools" },
] as const;

type Messages = Readonly<Record<string, string>>;

export function matchesToolQuery(
  tool: InternalTool,
  query: string,
  messages: Messages,
): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (needle === "") return true;
  return [tool.titleKey, tool.descriptionKey, tool.keywordsKey]
    .map((key) => messages[key] ?? "")
    .join(" ")
    .toLocaleLowerCase()
    .includes(needle);
}
