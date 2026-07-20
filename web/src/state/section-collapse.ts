import { buildToggleState } from "./toggle-state";
import { BuildMigratorMap } from "../utility";

const SECTION_COLLAPSE_VERSION = 1;

export function migrateSectionCollapseV0(keys: string[] | null): string[] {
  if (keys === null) return [];

  return keys.map((key) => {
    const match = /^section-Act_(\d+)$/.exec(key);
    if (match === null) return key;

    const act = Number(match[1]);
    return act >= 1 && act <= 10 ? `section-${act - 1}` : key;
  });
}

const SECTION_COLLAPSE_MIGRATORS = BuildMigratorMap([
  [0, 1, migrateSectionCollapseV0],
]);
const sectionCollapseFamily = buildToggleState(
  SECTION_COLLAPSE_VERSION,
  "section-collapse",
  SECTION_COLLAPSE_MIGRATORS,
);

export { sectionCollapseFamily };
