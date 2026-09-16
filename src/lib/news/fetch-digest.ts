import { freshnessOf, moscowDayStart, toNewsItem } from "./classify";
import { parseRss } from "./parse-rss";
import { GOOGLE_SOURCES, RSS_FEEDS, googleNewsUrl } from "./sources";
import type { Category, DigestResponse, NewsItem, RawArticle } from "./types";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; SpbFamilyDigest/1.0; +https://github.com/meshbor/kvartira-zadachi)",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

const MAX_AGE_DAYS = 45;
const FALLBACK_AGE_DAYS = 90;

async function fetchText(url: string, fresh = false) {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 1800 } }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Не удалось прочитать ленту (${response.status})`);
  }

  return response.text();
}

async function loadGoogleArticles(fresh = false) {
  const warnings: string[] = [];
  const articles: RawArticle[] = [];

  const results = await Promise.allSettled(
    GOOGLE_SOURCES.map(async (source) => {
      const xml = await fetchText(googleNewsUrl(source.query), fresh);
      return parseRss(xml, "Google Новости");
    }),
  );

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
      return;
    }
    warnings.push(`Лента «${GOOGLE_SOURCES[index].id}» сейчас недоступна`);
  });

  return { articles, warnings };
}

async function loadRssArticles(fresh = false) {
  const warnings: string[] = [];
  const articles: RawArticle[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const xml = await fetchText(feed.url, fresh);
      return parseRss(xml, feed.name);
    }),
  );

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
      return;
    }
    warnings.push(`Источник «${RSS_FEEDS[index].name}» сейчас недоступен`);
  });

  return { articles, warnings };
}

function titleSignature(title: string) {
  const stop = new Set([
    "петербурге",
    "петербург",
    "санкт",
    "открыли",
    "открылся",
    "после",
    "этом",
    "году",
    "более",
  ]);
  return title
    .toLowerCase()
    .replace(/[«»"().]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !stop.has(word))
    .slice(0, 5)
    .join("|");
}

function mergeItems(left: NewsItem, right: NewsItem): NewsItem {
  const newer =
    new Date(right.publishedAt) > new Date(left.publishedAt) ? right : left;
  return {
    ...newer,
    categories: unique([...left.categories, ...right.categories]),
    districts: unique([...left.districts, ...right.districts]),
  };
}

function dedupe(items: NewsItem[]) {
  const seen = new Map<string, NewsItem>();

  for (const item of items) {
    const key = titleSignature(item.title) || item.id;
    const existing = seen.get(key);
    seen.set(key, existing ? mergeItems(existing, item) : item);
  }

  return [...seen.values()];
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function withinDays(item: NewsItem, now: Date, days: number) {
  return now.getTime() - new Date(item.publishedAt).getTime() <= days * 86_400_000;
}

function emptyCounts(): Record<Category, number> {
  return {
    park: 0,
    playground: 0,
    space: 0,
    yard: 0,
    embankment: 0,
  };
}

function moscowHour(now: Date) {
  return Number(
    new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "numeric",
      hour12: false,
    }).format(now),
  );
}

function greetingFor(now: Date) {
  const hour = moscowHour(now);
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

function todayLabel(now: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
}

function summarize(items: NewsItem[], freshCount: number) {
  if (!items.length) {
    return "Свежих заметок про парки и площадки сейчас мало. Попробуйте обновить ленту чуть позже или посмотрите карту мест справа.";
  }

  const districts = unique(items.flatMap((item) => item.districts));
  const districtText = districts.length
    ? ` Чаще всего упоминаются ${districts.slice(0, 3).join(", ")}.`
    : "";

  if (freshCount) {
    return `За последние сутки нашли ${freshCount} ${plural(freshCount, "новость", "новости", "новостей")} про места, куда можно выйти с детьми.${districtText}`;
  }

  return `С утра тише, поэтому собрали ${items.length} ${plural(items.length, "материал", "материала", "материалов")} за последние недели: новые парки, дворы и площадки.${districtText}`;
}

function plural(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function emptyDigest(message: string, now = new Date()): DigestResponse {
  return {
    generatedAt: now.toISOString(),
    greeting: "Доброе утро",
    summary: message,
    todayLabel: new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(now),
    items: [],
    freshCount: 0,
    counts: emptyCounts(),
    warnings: [message],
  };
}

export async function fetchDigest(now = new Date(), fresh = false): Promise<DigestResponse> {
  const [google, rss] = await Promise.all([
    loadGoogleArticles(fresh),
    loadRssArticles(fresh),
  ]);
  const raw = [...google.articles, ...rss.articles];

  const mapped = raw
    .map((article) => toNewsItem(article, now))
    .filter((item): item is NewsItem => Boolean(item));

  let items = dedupe(mapped)
    .filter((item) => withinDays(item, now, MAX_AGE_DAYS))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  if (items.length < 8) {
    items = dedupe(mapped)
      .filter((item) => withinDays(item, now, FALLBACK_AGE_DAYS))
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
  }

  items = items.slice(0, 40);

  const todayStart = moscowDayStart(now);
  const freshCount = items.filter((item) => {
    const published = new Date(item.publishedAt);
    return published >= new Date(todayStart.getTime() - 36 * 60 * 60 * 1000);
  }).length;

  const counts = emptyCounts();
  for (const item of items) {
    for (const category of item.categories) {
      counts[category] += 1;
    }
  }

  return {
    generatedAt: now.toISOString(),
    greeting: greetingFor(now),
    summary: summarize(items, freshCount),
    todayLabel: todayLabel(now),
    items: items.map((item) => ({
      ...item,
      freshness: freshnessOf(new Date(item.publishedAt), now),
    })),
    freshCount,
    counts,
    warnings: [...google.warnings, ...rss.warnings],
  };
}
