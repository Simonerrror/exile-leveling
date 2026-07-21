import type { MessageKey } from "../../i18n/core";

const craftingIcon = new URL(
  "../../components/FragmentStep/Fragment/images/crafting.png",
  import.meta.url,
).href;
const waypointIcon = new URL(
  "../../components/FragmentStep/Fragment/images/waypoint.png",
  import.meta.url,
).href;
const wisdomIcon = new URL(
  "../../components/GemCost/images/wisdom.png",
  import.meta.url,
).href;
const jewelIcon = new URL(
  "../RegexCatalog/images/regex-tool-jewels.png",
  import.meta.url,
).href;
const gemIcon = new URL(
  "../RegexCatalog/images/regex-tool-vendor.png",
  import.meta.url,
).href;

export type InternalToolId = "leveling" | "regex" | "build" | "tree" | "gems";
export type InternalToolCategoryId = "tools" | "reference";

export type InternalTool = Readonly<{
  id: InternalToolId;
  href: string;
  category: InternalToolCategoryId;
  accent: "planning" | "regex" | "reference";
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
  {
    id: "build",
    href: "/build",
    category: "reference",
    accent: "reference",
    icon: craftingIcon,
    titleKey: "tools.build.title",
    descriptionKey: "tools.build.description",
    keywordsKey: "tools.build.keywords",
  },
  {
    id: "tree",
    href: "/leveling?view=tree",
    category: "reference",
    accent: "reference",
    icon: jewelIcon,
    titleKey: "tools.tree.title",
    descriptionKey: "tools.tree.description",
    keywordsKey: "tools.tree.keywords",
  },
  {
    id: "gems",
    href: "/leveling?view=gems",
    category: "reference",
    accent: "reference",
    icon: gemIcon,
    titleKey: "tools.gems.title",
    descriptionKey: "tools.gems.description",
    keywordsKey: "tools.gems.keywords",
  },
] as const satisfies readonly InternalTool[];

export const internalToolCategories = [
  { id: "tools", titleKey: "tools.category.tools" },
  { id: "reference", titleKey: "tools.category.reference" },
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
