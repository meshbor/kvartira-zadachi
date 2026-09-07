import * as cheerio from "cheerio";
import type { DigestItem, HtmlSource, SourceError } from "./types.ts";

export async function fetchHtmlSource(
  source: HtmlSource,
  since: Date,
): Promise<{ items: DigestItem[]; error?: SourceError }> {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "FamilyDigestBot/1.0 (personal news reader)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const items: DigestItem[] = [];

    $(source.itemSelector).each((_, node) => {
      const root = $(node);
      const title = root.find(source.titleSelector).first().text().replace(/\s+/g, " ").trim();
      const href =
        root.find(source.linkSelector).first().attr("href") ??
        root.find(source.titleSelector).closest("a").attr("href");
      const snippet = source.snippetSelector
        ? root.find(source.snippetSelector).first().text().replace(/\s+/g, " ").trim()
        : "";
      const timeValue = source.dateSelector
        ? root.find(source.dateSelector).first().attr("datetime")
        : undefined;
      const publishedAt = timeValue ? new Date(timeValue) : null;

      if (!title || !href) {
        return;
      }

      if (publishedAt && !Number.isNaN(publishedAt.getTime()) && publishedAt < since) {
        return;
      }

      items.push({
        title,
        url: new URL(href, source.url).toString(),
        source: source.name,
        sourceId: source.id,
        kind: "html",
        publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
        snippet,
      });
    });

    return { items };
  } catch (error) {
    return {
      items: [],
      error: {
        sourceId: source.id,
        source: source.name,
        message: error instanceof Error ? error.message : "Unknown HTML error",
      },
    };
  }
}
