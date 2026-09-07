import * as cheerio from "cheerio";
import type { DigestItem, SourceError, TelegramSource } from "./types.ts";

const PREVIEW_HEADERS = {
  "User-Agent": "FamilyDigestBot/1.0 (personal public preview reader)",
  Accept: "text/html",
};

export async function fetchTelegramSource(
  source: TelegramSource,
  since: Date,
): Promise<{ items: DigestItem[]; error?: SourceError }> {
  const username = source.username.replace(/^@/, "").trim();
  if (!username) {
    return { items: [] };
  }

  try {
    const response = await fetch(`https://t.me/s/${username}`, {
      headers: PREVIEW_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const items: DigestItem[] = [];

    $(".tgme_widget_message").each((_, node) => {
      const message = $(node);
      const url =
        message.find(".tgme_widget_message_date").attr("href") ??
        `https://t.me/${username}`;
      const text = messageText(message.find(".tgme_widget_message_text").html());
      const time = message.find("time").attr("datetime");
      const publishedAt = time ? new Date(time) : null;

      if (!text) {
        return;
      }

      if (publishedAt && !Number.isNaN(publishedAt.getTime()) && publishedAt < since) {
        return;
      }

      items.push({
        title: telegramTitle(text),
        url,
        source: source.name,
        sourceId: source.id,
        kind: "telegram",
        publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
        snippet: text,
      });
    });

    return { items };
  } catch (error) {
    return {
      items: [],
      error: {
        sourceId: source.id,
        source: source.name,
        message: error instanceof Error ? error.message : "Unknown Telegram preview error",
      },
    };
  }
}

function messageText(html: string | null): string {
  const withBreaks = (html ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n");
  return cheerio
    .load(`<div>${withBreaks}</div>`)("div")
    .text()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function telegramTitle(text: string): string {
  const firstLine = text.split("\n").map((line) => line.trim()).find(Boolean) ?? text;
  return firstLine.slice(0, 140);
}
