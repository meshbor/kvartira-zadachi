import type { Category, Freshness } from "./news/types";

export const CATEGORY_LABELS: Record<Category, string> = {
  park: "Парки и скверы",
  playground: "Площадки",
  space: "Пространства",
  yard: "Дворы",
  embankment: "Набережные",
};

export const FRESHNESS_LABELS: Record<Freshness, string> = {
  today: "сегодня",
  yesterday: "вчера",
  week: "на этой неделе",
  older: "ранее",
};

export function formatPublishedAt(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}
