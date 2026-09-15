import { freshnessOf } from "@/lib/news/classify";
import { parseRss } from "@/lib/news/parse-rss";
import { googleNewsUrl } from "@/lib/news/sources";
import type { RawArticle } from "@/lib/news/types";
import { categorize, matchesTopic, whyFor } from "./filter";
import { FAMILY_GOOGLE_QUERIES, FAMILY_RSS_FEEDS } from "./sources";
import type { FamilyCategory, FamilyDigestResponse, FamilyNewsItem } from "./types";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; FamilyDigest/1.0; +https://github.com/meshbor/kvartira-zadachi)",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

const LOOKBACK_HOURS = 72;
const MAX_ITEMS = 24;

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Не удалось прочитать ленту (${response.status})`);
  }
  return response.text();
}

function hashId(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return `f${hash.toString(16)}`;
}

function titleKey(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
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

function emptyCounts(): Record<FamilyCategory, number> {
  return { housing: 0, payments: 0, school: 0, family: 0 };
}

function plural(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function toFamilyItem(article: RawArticle, now: Date): FamilyNewsItem | null {
  if (!article.title || !article.url) return null;
  const text = `${article.title}\n${article.excerpt}`;
  if (!matchesTopic(text)) return null;

  const publishedAt = article.publishedAt ?? now;
  const category = categorize(text);
  return {
    id: hashId(`${titleKey(article.title)}|${article.source}`),
    title: article.title,
    url: article.url,
    source: article.source,
    publishedAt: publishedAt.toISOString(),
    excerpt: article.excerpt.slice(0, 280),
    category,
    freshness: freshnessOf(publishedAt, now),
    why: whyFor(category),
  };
}

async function loadGoogle() {
  const warnings: string[] = [];
  const articles: RawArticle[] = [];
  const results = await Promise.allSettled(
    FAMILY_GOOGLE_QUERIES.map(async (source) => {
      const xml = await fetchText(googleNewsUrl(source.query));
      return parseRss(xml, "Google Новости");
    }),
  );
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
      return;
    }
    warnings.push(`Лента «${FAMILY_GOOGLE_QUERIES[index].id}» сейчас недоступна`);
  });
  return { articles, warnings };
}

async function loadRss() {
  const warnings: string[] = [];
  const articles: RawArticle[] = [];
  const results = await Promise.allSettled(
    FAMILY_RSS_FEEDS.map(async (feed) => {
      const xml = await fetchText(feed.url);
      return parseRss(xml, feed.name);
    }),
  );
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
      return;
    }
    warnings.push(`Источник «${FAMILY_RSS_FEEDS[index].name}» сейчас недоступен`);
  });
  return { articles, warnings };
}

function dedupe(items: FamilyNewsItem[]) {
  const seen = new Set<string>();
  const unique: FamilyNewsItem[] = [];
  for (const item of items) {
    const key = titleKey(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function summarize(items: FamilyNewsItem[], freshCount: number) {
  if (!items.length) {
    return "За последние дни по выплатам, жилью и льготам для семей ничего свежего не нашли. Обновите ленту чуть позже.";
  }
  if (freshCount) {
    return `За последние сутки нашли ${freshCount} ${plural(freshCount, "новость", "новости", "новостей")} про многодетных, выплаты и жильё.`;
  }
  return `С утра тише, поэтому собрали ${items.length} ${plural(items.length, "материал", "материала", "материалов")} за последние дни: жильё, выплаты и льготы.`;
}

export function emptyFamilyDigest(
  message: string,
  now = new Date(),
): FamilyDigestResponse {
  return {
    generatedAt: now.toISOString(),
    greeting: greetingFor(now),
    summary: message,
    todayLabel: todayLabel(now),
    lookbackHours: LOOKBACK_HOURS,
    items: [],
    freshCount: 0,
    counts: emptyCounts(),
    warnings: [message],
  };
}

export async function fetchFamilyDigest(
  now = new Date(),
): Promise<FamilyDigestResponse> {
  const since = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const [google, rss] = await Promise.all([loadGoogle(), loadRss()]);
  const mapped = [...google.articles, ...rss.articles]
    .map((article) => toFamilyItem(article, now))
    .filter((item): item is FamilyNewsItem => Boolean(item))
    .filter((item) => new Date(item.publishedAt) >= since);

  const items = dedupe(mapped)
    .sort(
      (left, right) =>
        new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
    )
    .slice(0, MAX_ITEMS);

  const counts = emptyCounts();
  for (const item of items) counts[item.category] += 1;

  const freshCount = items.filter(
    (item) => item.freshness === "today" || item.freshness === "yesterday",
  ).length;

  return {
    generatedAt: now.toISOString(),
    greeting: greetingFor(now),
    summary: summarize(items, freshCount),
    todayLabel: todayLabel(now),
    lookbackHours: LOOKBACK_HOURS,
    items,
    freshCount,
    counts,
    warnings: [...google.warnings, ...rss.warnings],
  };
}
