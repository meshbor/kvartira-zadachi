import type { Category } from "./types";

export type GoogleSource = {
  id: string;
  categoryHint: Category;
  query: string;
};

export const GOOGLE_SOURCES: GoogleSource[] = [
  {
    id: "parks",
    categoryHint: "park",
    query:
      "новый парк Санкт-Петербург OR сквер Петербург благоустройство OR сад Петербург открытие",
  },
  {
    id: "playgrounds",
    categoryHint: "playground",
    query:
      "детская площадка Санкт-Петербург открытие OR игровая площадка Петербург благоустройство",
  },
  {
    id: "spaces",
    categoryHint: "space",
    query:
      "общественное пространство Санкт-Петербург OR благоустройство сквер Петербург дети",
  },
  {
    id: "yards",
    categoryHint: "yard",
    query: '"Петербургские дворы" детская площадка OR двор благоустройство Петербург',
  },
  {
    id: "embankments",
    categoryHint: "embankment",
    query:
      "набережная Петербург открытие благоустройство OR пляж Петербург открытие -зарядк",
  },
];

export const RSS_FEEDS = [
  {
    id: "kanoner",
    name: "Канонер",
    url: "https://kanoner.com/feed/",
  },
] as const;

export function googleNewsUrl(query: string) {
  const params = new URLSearchParams({
    q: query,
    hl: "ru",
    gl: "RU",
    ceid: "RU:ru",
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}
