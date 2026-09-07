import { describe, expect, it } from "vitest";
import { escapeHtml, formatDigest } from "./format.ts";
import type { DigestItem } from "./sources/types.ts";

const item: DigestItem = {
  title: "Льготы для многодетных <семей>",
  url: "https://example.com/news",
  source: "ТАСС",
  sourceId: "tass",
  kind: "rss",
  publishedAt: new Date("2026-09-07T06:00:00Z"),
  snippet: "Коротко о выплатах",
};

describe("escapeHtml", () => {
  it("escapes markup", () => {
    expect(escapeHtml("A <b> & C")).toBe("A &lt;b&gt; &amp; C");
  });
});

describe("formatDigest", () => {
  it("renders an empty morning", () => {
    const [message] = formatDigest({
      items: [],
      errors: [],
      lookbackHours: 24,
      now: new Date("2026-09-08T04:30:00Z"),
      timezone: "Europe/Moscow",
    });

    expect(message).toContain("Многодетные");
    expect(message).toContain("ничего нового не нашёл");
  });

  it("groups items and escapes titles", () => {
    const [message] = formatDigest({
      items: [item],
      errors: [],
      lookbackHours: 24,
      now: new Date("2026-09-08T04:30:00Z"),
      timezone: "Europe/Moscow",
    });

    expect(message).toContain("Выплаты");
    expect(message).toContain("Льготы для многодетных &lt;семей&gt;");
    expect(message).toContain("https://example.com/news");
    expect(message).not.toContain("<семей>");
  });

  it("mentions failed sources", () => {
    const [message] = formatDigest({
      items: [],
      errors: [{ sourceId: "ria", source: "РИА Новости", message: "timeout" }],
      lookbackHours: 24,
    });

    expect(message).toContain("РИА Новости");
  });
});
