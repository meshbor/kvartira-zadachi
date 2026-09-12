import { detectDistricts } from "./districts";
import type { Category, Freshness, NewsItem, RawArticle } from "./types";

const CITY_RE =
  /петербург|санкт[-\s]?петербург|\bспб\b|ленинградск|петроград|петергоф|пушкин|колпино|кронштадт|ломоносов|павловск|сестрорецк|парголово|шушары|купчино|мурино|парнас|девяткино|рыбацк/iu;

const MOSCOW_ONLY_RE = /\bмоскв|\bмск\b|подмосков/iu;

const NEGATIVE_RE =
  /электрозаправ|зарядк[а-яё]*\s+для\s+электро|убийств|застрел|труп|изнасил|теракт|дтп со смерт|наркотик|суд признал|приговор|детск[а-яё]*\s+сад|дошкольн|ясли[-\s]?сад/iu;

const CATEGORY_RULES: { category: Category; re: RegExp; why: string }[] = [
  {
    category: "playground",
    re: /детск[а-яё]*[\s\dа-яё]{0,28}площад|игров[а-яё]*\s+площад|качел|песочниц|воркаут|скейт|памп[-\s]?трек|площад[а-яё]*\s+для\s+(малыш|дет)/iu,
    why: "Детская или спортивная площадка",
  },
  {
    category: "park",
    re: /парк|сквер|бульвар|(?<!детск[а-яё]{0,6}\s)сад(?!овник)|аллея/iu,
    why: "Парк, сквер или сад",
  },
  {
    category: "embankment",
    re: /набережн|пляж|берегов[а-яё]*\s+лин/iu,
    why: "Набережная, пляж или берег",
  },
  {
    category: "yard",
    re: /петербургские дворы|внутриквартал|у своего дома|во дворе|дворово/iu,
    why: "Двор или программа «Петербургские дворы»",
  },
  {
    category: "space",
    re: /общественн[а-яё]*\s+пространств|пешеходн[а-яё]*\s+зон|место для прогул|зона отдыха/iu,
    why: "Общественное пространство для прогулок",
  },
];

const WALK_RE =
  /благоустрой|открыл|открыт|появил|обновил|реконструк|детск|прогул|площад|парк|сквер|сад|набережн|двор|общественн[а-яё]*\s+пространств|пляж/iu;

function normalizeText(value: string) {
  return value.replace(/[\u00a0\u202f\u2007\s]+/g, " ").trim();
}

export function normalizeTitle(title: string) {
  return normalizeText(title)
    .toLowerCase()
    .replace(/[«»""]/g, "");
}

export function isRelevantForWalks(article: RawArticle): boolean {
  const text = normalizeText(`${article.title} ${article.excerpt}`);
  if (!WALK_RE.test(text)) return false;
  if (NEGATIVE_RE.test(text)) return false;
  if (!CITY_RE.test(text) && MOSCOW_ONLY_RE.test(text)) return false;
  if (!CITY_RE.test(text) && !detectDistricts(text).length) return false;
  return CATEGORY_RULES.some((rule) => rule.re.test(text));
}

export function classifyArticle(article: RawArticle): {
  categories: Category[];
  why: string;
  districts: string[];
} {
  const text = normalizeText(`${article.title} ${article.excerpt}`);
  const categories = CATEGORY_RULES.filter((rule) => rule.re.test(text)).map(
    (rule) => rule.category,
  );
  const first = CATEGORY_RULES.find((rule) => rule.re.test(text));

  return {
    categories: categories.length ? categories : ["space"],
    why: first?.why ?? "Место, куда можно выйти с детьми",
    districts: detectDistricts(text),
  };
}

export function freshnessOf(date: Date, now: Date): Freshness {
  const startOfToday = moscowDayStart(now);
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (date >= startOfToday) return "today";
  if (date >= startOfYesterday) return "yesterday";
  if (date >= weekAgo) return "week";
  return "older";
}

export function moscowDayStart(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day, 0 - 3, 0, 0));
}

export function toNewsItem(article: RawArticle, now = new Date()): NewsItem | null {
  if (!article.title || !article.url) return null;
  if (!isRelevantForWalks(article)) return null;

  const publishedAt = article.publishedAt ?? now;
  const classified = classifyArticle(article);

  return {
    id: hashId(`${normalizeTitle(article.title)}|${article.source}`),
    title: article.title,
    url: article.url,
    source: article.source,
    publishedAt: publishedAt.toISOString(),
    excerpt: article.excerpt.slice(0, 280),
    categories: classified.categories,
    districts: classified.districts,
    freshness: freshnessOf(publishedAt, now),
    why: classified.why,
  };
}

function hashId(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return `n${hash.toString(16)}`;
}
