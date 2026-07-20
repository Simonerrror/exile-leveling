const DISPLAY_FRAGMENTS = new Set([
  "kill",
  "arena",
  "quest_text",
  "generic",
  "reward_quest",
  "reward_vendor",
  "copy",
]);

export function routeSignature(line: string): string {
  const indent = line.match(/^\s*/)?.[0].length ?? 0;
  const directive = line.trimStart().startsWith("#")
    ? line.trim().replace(/^#section\s+.+$/, "#section")
    : "";
  const fragments = [...line.matchAll(/\{([^{}]+)\}/g)].map((match) => {
    const [type, ...parameters] = match[1].split("|");
    if (DISPLAY_FRAGMENTS.has(type)) return `{${type}|display}`;
    return `{${[type, ...parameters].join("|")}}`;
  });

  return JSON.stringify({ indent, directive, fragments });
}

export function assertMessageParity(
  english: Record<string, string>,
  russian: Record<string, string>,
): void {
  for (const key of Object.keys(english)) {
    if (!(key in russian))
      throw new Error(`missing Russian message key: ${key}`);
  }
  for (const key of Object.keys(russian)) {
    if (!(key in english))
      throw new Error(`unknown Russian message key: ${key}`);
  }
}

export function assertRouteParity(
  english: string,
  russian: string,
  name: string,
): void {
  const enLines = english.replaceAll("\r\n", "\n").split("\n");
  const ruLines = russian.replaceAll("\r\n", "\n").split("\n");
  if (enLines.length !== ruLines.length)
    throw new Error(`route line count differs: ${name}`);

  enLines.forEach((line, index) => {
    if (routeSignature(line) !== routeSignature(ruLines[index]))
      throw new Error(`route structure differs: ${name} line ${index + 1}`);
  });
}
