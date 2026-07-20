const SINGLE_DISPLAY_FRAGMENTS = new Set([
  "arena",
  "quest_text",
  "generic",
  "reward_quest",
]);

function assertFragmentArity(
  type: string,
  count: number,
  minimum: number,
  maximum?: number,
): void {
  if (count >= minimum && (maximum === undefined || count <= maximum)) return;

  const expected =
    maximum === undefined
      ? `at least ${minimum}`
      : minimum === maximum
        ? String(minimum)
        : `${minimum}-${maximum}`;
  throw new Error(
    `invalid route fragment arity: ${type} expected ${expected}, received ${count}`,
  );
}

function displayFragmentSignature(
  type: string,
  parameters: string[],
): string | undefined {
  if (SINGLE_DISPLAY_FRAGMENTS.has(type)) {
    assertFragmentArity(type, parameters.length, 1, 1);
    return `{${type}|display}`;
  }
  if (type === "reward_vendor") {
    assertFragmentArity(type, parameters.length, 1, 2);
    const cost = parameters[1] === undefined ? "" : `|${parameters[1]}`;
    return `{${type}|display${cost}}`;
  }
  if (type === "copy") {
    assertFragmentArity(type, parameters.length, 1);
    return `{${type}|display}`;
  }
}

export function routeSignature(line: string): string {
  const indent = line.match(/^\s*/)?.[0].length ?? 0;
  const content = line.slice(indent);
  const translatedDirective = content.match(/^#(section|sub)(?:\s|$)/)?.[1];
  const directive = content.startsWith("#")
    ? translatedDirective
      ? `#${translatedDirective}`
      : content
    : "";
  const fragments = [...line.matchAll(/\{([^{}]+)\}/g)].map((match) => {
    const [type, ...parameters] = match[1].split("|");
    const displaySignature = displayFragmentSignature(type, parameters);
    if (displaySignature !== undefined) return displaySignature;
    return `{${[type, ...parameters].join("|")}}`;
  });

  return JSON.stringify({ indent, directive, fragments });
}

export function assertMessageDictionary(
  value: unknown,
  path: string,
): asserts value is Record<string, string> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(
      `invalid message dictionary root: ${path} must be a plain object`,
    );
  }

  for (const [key, message] of Object.entries(value)) {
    if (typeof message !== "string") {
      throw new Error(
        `invalid message dictionary value: ${path} key ${key} must be a string`,
      );
    }
  }
}

export function assertMessageParity(
  english: Record<string, string>,
  russian: Record<string, string>,
): void {
  for (const key of Object.keys(english)) {
    if (!Object.hasOwn(russian, key))
      throw new Error(`missing Russian message key: ${key}`);
  }
  for (const key of Object.keys(russian)) {
    if (!Object.hasOwn(english, key))
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
    let englishSignature: string;
    let russianSignature: string;
    try {
      englishSignature = routeSignature(line);
      russianSignature = routeSignature(ruLines[index]);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("invalid route fragment arity:")
      ) {
        throw new Error(
          `route structure differs: ${name} line ${index + 1}: ${error.message}`,
          { cause: error },
        );
      }
      throw error;
    }

    if (englishSignature !== russianSignature)
      throw new Error(`route structure differs: ${name} line ${index + 1}`);
  });
}
