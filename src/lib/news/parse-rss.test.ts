import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanExcerpt, stripHtml } from "./parse-rss";

test("strips encoded Google News html from excerpts", () => {
  const raw =
    "&lt;a href=&quot;https://news.google.com/rss/articles/ABC&quot;&gt;Набережную Охты открыли в Петербурге&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font color=&quot;#6f6f6f&quot;&gt;ФОНТАНКА.ру&lt;/font&gt;";
  assert.equal(stripHtml(raw).includes("<a href"), false);
  assert.equal(
    cleanExcerpt("Набережную Охты открыли в Петербурге", raw),
    "",
  );
});
