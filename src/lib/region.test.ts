import assert from "node:assert/strict";
import { test } from "node:test";
import { filterByRegion, itemMentionsSpbLenobl, mentionsSpbLenobl } from "./region";

test("keeps Petersburg and Lenobl family news", () => {
  assert.equal(mentionsSpbLenobl("В Петербурге расширили льготы многодетным"), true);
  assert.equal(mentionsSpbLenobl("Маткапитал в Ленинградской области"), true);
  assert.equal(mentionsSpbLenobl("Единое пособие в Мурино"), true);
  assert.equal(itemMentionsSpbLenobl({ title: "Льготы", source: "Фонтанка" }), true);
});

test("drops other regions", () => {
  assert.equal(mentionsSpbLenobl("Соцфонд Татарстана ускорил маткапитал"), false);
  assert.equal(mentionsSpbLenobl("В Пензе жительница Самары получила капитал"), false);
});

test("filterByRegion can be switched off", () => {
  const items = [
    { title: "Петербург: ипотека", excerpt: "", source: "ТАСС" },
    { title: "Татарстан: маткапитал", excerpt: "", source: "ТАСС" },
  ];
  assert.equal(filterByRegion(items, true, (item) => item).length, 1);
  assert.equal(filterByRegion(items, false, (item) => item).length, 2);
});
