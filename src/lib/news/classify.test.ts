import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyArticle, isRelevantForWalks, toNewsItem } from "./classify";

test("keeps a new square with playgrounds", () => {
  const article = {
    title: "Карпатский сквер во Фрунзенском районе открыли после благоустройства",
    url: "https://example.com/square",
    source: "Фонтанка",
    publishedAt: new Date("2026-09-09T10:00:00+03:00"),
    excerpt: "Появились две детские площадки и зоны отдыха.",
  };

  assert.equal(isRelevantForWalks(article), true);
  const item = toNewsItem(article, new Date("2026-09-12T09:00:00+03:00"));
  assert.ok(item);
  assert.ok(item.categories.includes("park"));
  assert.ok(item.districts.includes("Фрунзенский"));
});

test("marks yard news with playgrounds", () => {
  const classified = classifyArticle({
    title:
      "В этом году по программе «Петербургские дворы» планируют открыть 197 детских и 86 спортивных площадок",
    url: "https://example.com/yards",
    source: "Администрация",
    publishedAt: new Date(),
    excerpt: "",
  });
  assert.ok(classified.categories.includes("playground"));
  assert.ok(classified.categories.includes("yard"));
});

test("drops kindergarten openings", () => {
  const article = {
    title: "В Пушкине открылся детский сад на 330 мест от ГК «КВС»",
    url: "https://example.com/kg",
    source: "Дневник",
    publishedAt: new Date(),
    excerpt: "Новое здание на 330 мест.",
  };

  assert.equal(isRelevantForWalks(article), false);
  assert.equal(
    isRelevantForWalks({
      ...article,
      title: "В Пушкине открылся детский\u00a0сад на 330 мест",
    }),
    false,
  );
});

test("does not treat повседневного as Невский", () => {
  const item = toNewsItem({
    title:
      "По программе «Петербургские дворы» на улице Костылева в Ломоносове появилось место для отдыха",
    url: "https://example.com/lomonosov",
    source: "Администрация",
    publishedAt: new Date(),
    excerpt: "Рядом с домом можно погулять с детьми.",
  });
  assert.ok(item);
  assert.ok(item.districts.includes("Петродворцовый"));
  assert.equal(item.districts.includes("Невский"), false);
});

test("drops car chargers on embankments", () => {
  const article = {
    title: "Пятую электрозаправку Петербурга открыли на Октябрьской набережной",
    url: "https://example.com/ev",
    source: "СПб",
    publishedAt: new Date(),
    excerpt: "Зарядка для электромобилей.",
  };

  assert.equal(isRelevantForWalks(article), false);
});
