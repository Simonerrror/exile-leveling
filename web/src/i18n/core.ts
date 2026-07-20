import en from "./messages/en.json";
import ru from "./messages/ru.json";

export type Locale = "en" | "ru";
export type MessageKey = keyof typeof en;
export type MessageParameters = Record<string, string | number>;

type MessageCatalog<Key extends string> = Readonly<{
  en: Readonly<Record<Key, string>>;
  ru: Readonly<Partial<Record<Key, string>>>;
}>;

const messages: Readonly<Record<Locale, Readonly<Record<MessageKey, string>>>> =
  { en, ru };

export function normalizeLocale(value: unknown): Locale {
  return typeof value === "string" && /^ru(?:-|$)/i.test(value) ? "ru" : "en";
}

export function formatMessage(
  message: string,
  parameters: MessageParameters = {},
): string {
  return message.replace(/\{(\w+)\}/g, (token, key) =>
    Object.hasOwn(parameters, key) ? String(parameters[key]) : token,
  );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  parameters: MessageParameters = {},
): string {
  return translateCatalog(messages, locale, key, parameters);
}

export function translateCatalog<Key extends string>(
  catalog: MessageCatalog<Key>,
  locale: Locale,
  key: Key,
  parameters: MessageParameters = {},
): string {
  return formatMessage(catalog[locale][key] ?? catalog.en[key], parameters);
}
