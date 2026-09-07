import { config } from "./config.ts";
import { matchesTopic } from "./filter.ts";
import { formatDigest } from "./format.ts";
import { loadSources } from "./sources/load-sources.ts";
import { fetchHtmlSource } from "./sources/html.ts";
import { fetchRssSource } from "./sources/rss.ts";
import { fetchTelegramSource } from "./sources/telegram-web.ts";
import type { DigestItem, SourceError } from "./sources/types.ts";

const MAX_ITEMS = 15;

export type DigestResult = {
  items: DigestItem[];
  fetched: number;
  errors: SourceError[];
  messages: string[];
};

export async function collectDigest(now = new Date()): Promise<DigestResult> {
  const since = new Date(now.getTime() - config.lookbackHours * 60 * 60 * 1000);
  const sources = await loadSources();
  const errors: SourceError[] = [];
  const collected: DigestItem[] = [];

  const results = await Promise.all([
    ...sources.rss.map((source) => fetchRssSource(source, since)),
    ...sources.telegram.map((source) => fetchTelegramSource(source, since)),
    ...sources.html.map((source) => fetchHtmlSource(source, since)),
  ]);

  for (const result of results) {
    if (result.error) {
      errors.push(result.error);
    }
    collected.push(...result.items);
  }

  const items = dedupe(collected)
    .filter((item) => {
      const text =
        item.kind === "telegram" ? item.title : `${item.title}\n${item.snippet}`;
      return matchesTopic(text, config.extraKeywords);
    })
    .sort((left, right) => {
      const leftTime = left.publishedAt?.getTime() ?? 0;
      const rightTime = right.publishedAt?.getTime() ?? 0;
      return rightTime - leftTime;
    })
    .slice(0, MAX_ITEMS);

  return {
    items,
    fetched: collected.length,
    errors,
    messages: formatDigest({
      items,
      errors,
      lookbackHours: config.lookbackHours,
      now,
      timezone: config.timezone,
    }),
  };
}

function normalizeKey(item: DigestItem): string {
  const titleKey = item.title.toLowerCase().replace(/\s+/g, " ").replace(/[^\p{L}\p{N}\s]/gu, "").trim();

  try {
    const url = new URL(item.url);
    return `${url.hostname}${url.pathname}`.toLowerCase();
  } catch {
    return titleKey;
  }
}

function dedupe(items: DigestItem[]): DigestItem[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const unique: DigestItem[] = [];

  for (const item of items) {
    const urlKey = normalizeKey(item);
    const titleKey = item.title
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim();

    if (seenUrls.has(urlKey) || (titleKey && seenTitles.has(titleKey))) {
      continue;
    }

    seenUrls.add(urlKey);
    if (titleKey) {
      seenTitles.add(titleKey);
    }
    unique.push(item);
  }

  return unique;
}
