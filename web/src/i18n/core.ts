import en from "./messages/en.json";
import ru from "./messages/ru.json";

export type Locale = "en" | "ru";
export type MessageKey = keyof typeof en;
export type MessageParameters = Record<string, string | number>;

export const messages: Record<Locale, Record<MessageKey, string>> = { en, ru };

export function normalizeLocale(value: unknown): Locale {
  return typeof value === "string" && value.toLowerCase().startsWith("ru")
    ? "ru"
    : "en";
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
  return formatMessage(messages[locale][key] ?? en[key], parameters);
}
