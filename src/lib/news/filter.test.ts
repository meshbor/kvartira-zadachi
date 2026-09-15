import assert from "node:assert/strict";
import { test } from "node:test";
import { filterItems, interpretQuery } from "./filter";
import type { NewsItem } from "./types";

const item = (partial: Partial<NewsItem>): NewsItem => ({
  id: "n1",
  title: "В Парголово открыли новую детскую площадку",
  url: "https://example.com",
  source: "Вечерний Санкт-Петербург",
  publishedAt: "2026-08-07T10:00:00.000Z",
  excerpt: "",
  categories: ["playground"],
  districts: ["Выборгский"],
  freshness: "week",
  why: "Детская или спортивная площадка",
  ...partial,
});

test("площадки finds playground news", () => {
  const parsed = interpretQuery("площадки");
  assert.deepEqual(parsed.categories, ["playground"]);
  assert.equal(parsed.onlyFresh, false);
  const found = filterItems(
    [item({}), item({ id: "n2", categories: ["park"], title: "Открыли сквер" })],
    "площадки",
  );
  assert.equal(found.length, 1);
  assert.equal(found[0].id, "n1");
});
