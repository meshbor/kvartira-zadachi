import { categorize } from "./filter.ts";
import type { DigestCategory } from "./filter.ts";
import type { DigestItem, SourceError } from "./sources/types.ts";

const TELEGRAM_LIMIT = 3900;

const CATEGORY_ORDER: DigestCategory[] = [
  "Жильё",
  "Выплаты",
  "Школа и сад",
  "Семья и льготы",
];

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function formatDigest(options: {
  items: DigestItem[];
  errors: SourceError[];
  lookbackHours: number;
  now?: Date;
  timezone?: string;
}): string[] {
  const { items, errors, lookbackHours } = options;
  const now = options.now ?? new Date();
  const timezone = options.timezone ?? "Europe/Moscow";
  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(now);

  const header = `<b>Многодетные · ${escapeHtml(dateLabel)}</b>`;

  if (items.length === 0) {
    const empty = [
      header,
      "",
      `За последние ${lookbackHours} ч. по теме выплат, жилья и льгот для семей ничего нового не нашёл.`,
      errors.length > 0 ? `\nНе ответили: ${errors.map((error) => error.source).join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return [empty];
  }

  const grouped = new Map<DigestCategory, DigestItem[]>();
  for (const item of items) {
    const category = categorize(`${item.title} ${item.snippet}`);
    const list = grouped.get(category) ?? [];
    list.push(item);
    grouped.set(category, list);
  }

  const lines = [header, ""];

  for (const category of CATEGORY_ORDER) {
    const list = grouped.get(category);
    if (!list?.length) {
      continue;
    }

    lines.push(`<b>${category}</b>`);
    for (const item of list) {
      lines.push(`• ${escapeHtml(item.title)} — <a href="${escapeHtml(item.url)}">${escapeHtml(item.source)}</a>`);
    }
    lines.push("");
  }

  if (errors.length > 0) {
    lines.push(`Не ответили: ${escapeHtml(errors.map((error) => error.source).join(", "))}.`);
  }

  return splitMessage(lines.join("\n").trim());
}

function splitMessage(text: string): string[] {
  if (text.length <= TELEGRAM_LIMIT) {
    return [text];
  }

  const chunks: string[] = [];
  let current = "";

  for (const line of text.split("\n")) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > TELEGRAM_LIMIT) {
      if (current) {
        chunks.push(current);
      }
      current = line;
    } else {
      current = next;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
