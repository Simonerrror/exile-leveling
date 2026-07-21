import { splitRegexIntoTwoPasses } from "./two-pass.js";
import type { RegexCompileResult } from "./types.js";

export interface ItemAffixSelection {
  pattern: string;
  kind: "prefix" | "suffix";
}

export interface ItemCompileSettings {
  baseName: string;
  selected: ItemAffixSelection[];
  mode: "any" | "all" | "prefix-and-suffix";
  matchOpenAffix: boolean;
}

export function compileItemRegex(settings: ItemCompileSettings): RegexCompileResult {
  const selected = settings.selected.filter(({ pattern }) => pattern.length > 0);
  if (selected.length === 0) return splitRegexIntoTwoPasses("");
  let expression: string;
  if (settings.mode === "any") {
    expression = `"${selected.map(({ pattern }) => pattern).join("|")}"`;
  } else if (settings.mode === "all") {
    expression = selected.map(({ pattern }) => `"${pattern}"`).join(" ");
  } else {
    const prefixes = selected.filter(({ kind }) => kind === "prefix").map(({ pattern }) => pattern).join("|");
    const suffixes = selected.filter(({ kind }) => kind === "suffix").map(({ pattern }) => pattern).join("|");
    if (!prefixes || !suffixes) {
      expression = selected.map(({ pattern }) => `"${pattern}"`).join(" ");
    } else if (settings.matchOpenAffix && settings.baseName) {
      expression = `"^(${prefixes})\\s${settings.baseName}|^${settings.baseName}" "${settings.baseName}\\s(${suffixes})|${settings.baseName}$"`;
    } else {
      expression = `"${prefixes}" "${suffixes}"`;
    }
  }
  return splitRegexIntoTwoPasses(expression);
}
