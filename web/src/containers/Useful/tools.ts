import type { MessageKey } from "../../i18n/core";

export type InternalToolId = "leveling" | "regex" | "build" | "tree" | "gems";
export type InternalToolCategoryId = "tools" | "reference";

export type InternalTool = Readonly<{
  id: InternalToolId;
  href: string;
  category: InternalToolCategoryId;
  accent: "planning" | "regex" | "reference";
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
    titleKey: "tools.leveling.title",
    descriptionKey: "tools.leveling.description",
    keywordsKey: "tools.leveling.keywords",
  },
  {
    id: "regex",
    href: "/regex",
    category: "tools",
    accent: "regex",
    titleKey: "tools.regex.title",
    descriptionKey: "tools.regex.description",
    keywordsKey: "tools.regex.keywords",
  },
  {
    id: "build",
    href: "/build",
    category: "reference",
    accent: "reference",
    titleKey: "tools.build.title",
    descriptionKey: "tools.build.description",
    keywordsKey: "tools.build.keywords",
  },
  {
    id: "tree",
    href: "/leveling?view=tree",
    category: "reference",
    accent: "reference",
    titleKey: "tools.tree.title",
    descriptionKey: "tools.tree.description",
    keywordsKey: "tools.tree.keywords",
  },
  {
    id: "gems",
    href: "/leveling?view=gems",
    category: "reference",
    accent: "reference",
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
