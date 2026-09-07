import Parser from "rss-parser";
import type { DigestItem, RssSource, SourceError } from "./types.ts";

const parser = new Parser({
  timeout: 15_000,
  headers: {
    "User-Agent": "FamilyDigestBot/1.0 (personal RSS reader)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

export async function fetchRssSource(
  source: RssSource,
  since: Date,
): Promise<{ items: DigestItem[]; error?: SourceError }> {
  try {
    const feed = await parser.parseURL(source.url);
    const items = (feed.items ?? [])
      .map((item) => {
        const title = item.title?.trim() ?? "";
        const url = item.link?.trim() ?? "";
        const snippet = (item.contentSnippet ?? item.content ?? "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const publishedAt = parseDate(item.isoDate ?? item.pubDate);

        return {
          title,
          url,
          source: source.name,
          sourceId: source.id,
          kind: "rss" as const,
          publishedAt,
          snippet,
        };
      })
      .filter((item) => item.title && item.url)
      .filter((item) => item.publishedAt == null || item.publishedAt >= since);

    return { items };
  } catch (error) {
    return {
      items: [],
      error: {
        sourceId: source.id,
        source: source.name,
        message: error instanceof Error ? error.message : "Unknown RSS error",
      },
    };
  }
}

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
