import type { HeistRegexData } from "./data/types.js";

const conciseRussianNames: Record<string, string> = {
  Agility: "Проворство",
  "Brute Force": "Грубая сила",
  "Counter-Thaumaturgy": "Контрмагия",
  Deception: "Обман",
  Demolition: "Подрыв",
  Engineering: "Инженерия",
  Lockpicking: "Взлом",
  Perception: "Внимательность",
  "Trap Disarmament": "Обезвреживание ловушек",
};

export interface HeistContractLabel {
  id: string;
  primary: string;
  secondary?: string;
}

export function heistContractLabels(data: HeistRegexData): HeistContractLabel[] {
  const russian = Object.keys(data.translations.contractTypes).length > 0;
  return Object.keys(data.contractTypes).map((id) => ({
    id,
    primary: russian ? conciseRussianNames[id] ?? id : id,
    secondary: russian ? id : undefined,
  }));
}
