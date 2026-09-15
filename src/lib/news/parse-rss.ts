import type { RawArticle } from "./types";

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    );
}

export function stripHtml(value: string) {
  const decoded = decodeEntities(value);
  return decodeEntities(decoded.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanExcerpt(title: string, excerpt: string) {
  const text = stripHtml(excerpt);
  if (!text) return "";
  if (/https?:\/\//i.test(text) && !/[а-яё]{8,}/i.test(text)) return "";
  if (text.toLowerCase().includes(title.toLowerCase().slice(0, 48))) return "";
  return text.slice(0, 280);
}

function tagValue(block: string, tag: string) {
  const pattern = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,
    "i",
  );
  const match = block.match(pattern);
  return match ? stripHtml(match[1]) : "";
}

function tagAttr(block: string, tag: string, attr: string) {
  const pattern = new RegExp(
    `<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const match = block.match(pattern);
  return match ? decodeEntities(match[1]) : "";
}

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function splitTitleAndSource(title: string, source: string) {
  const cleaned = title
    .replace(/\s+/g, " ")
    .replace(/\s+[—\-]\s+Официальный сайт.*$/i, "")
    .trim();
  if (source) {
    return { title: cleaned.replace(new RegExp(`\\s+[—\\-]\\s+${escapeRegExp(source)}$`), ""), source };
  }

  const parts = cleaned.split(/\s+[—\-]\s+/);
  if (parts.length > 1) {
    return {
      title: parts.slice(0, -1).join(" — "),
      source: parts.at(-1) ?? "",
    };
  }

  return { title: cleaned, source: source || "Новости" };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseRss(xml: string, fallbackSource = "Новости"): RawArticle[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return items.map((item) => {
    const rawTitle = tagValue(item, "title");
    const source = tagValue(item, "source") || fallbackSource;
    const { title, source: resolvedSource } = splitTitleAndSource(
      rawTitle,
      source,
    );

    return {
      title,
      url: tagValue(item, "link") || tagAttr(item, "link", "href"),
      source: resolvedSource,
      publishedAt: parseDate(tagValue(item, "pubDate") || tagValue(item, "dc:date")),
      excerpt: cleanExcerpt(title, tagValue(item, "description")),
    };
  });
}
