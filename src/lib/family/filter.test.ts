import assert from "node:assert/strict";
import { test } from "node:test";
import {
  categorize,
  filterFamilyItems,
  interpretFamilyQuery,
  matchesTopic,
} from "./filter";
import type { FamilyNewsItem } from "./types";

test("matches strong family-benefit topics", () => {
  assert.equal(matchesTopic("Расширили льготы многодетным семьям"), true);
  assert.equal(matchesTopic("Материнский капитал можно направить на ипотеку"), true);
  assert.equal(matchesTopic("Слушайте подкаст про пособия"), false);
  assert.equal(matchesTopic("Новый парк открыли в Петербурге"), false);
});

test("categorizes housing and payments", () => {
  assert.equal(categorize("Семейная ипотека для многодетных"), "housing");
  assert.equal(categorize("Единое пособие повысят с января"), "payments");
  assert.equal(categorize("Места в детском саду для многодетных"), "school");
});

test("query жильё keeps housing news", () => {
  const parsed = interpretFamilyQuery("жильё");
  assert.deepEqual(parsed.categories, ["housing"]);
  const housing: FamilyNewsItem = {
    id: "h1",
    title: "450 тысяч на ипотеку многодетным",
    url: "https://example.com/h",
    source: "ТАСС",
    publishedAt: "2026-09-01T10:00:00.000Z",
    excerpt: "",
    category: "housing",
    freshness: "week",
    why: "Жильё",
  };
  const other: FamilyNewsItem = { ...housing, id: "p1", category: "payments" };
  assert.equal(filterFamilyItems([housing, other], "жильё").length, 1);
});
