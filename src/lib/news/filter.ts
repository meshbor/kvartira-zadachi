import { matchDistrictQuery } from "./districts";
import type { Category, NewsItem } from "./types";

const CATEGORY_ALIASES: Record<string, Category> = {
  парк: "park",
  парки: "park",
  сквер: "park",
  скверы: "park",
  сад: "park",
  площадка: "playground",
  площадки: "playground",
  детская: "playground",
  двор: "yard",
  дворы: "yard",
  набережная: "embankment",
  набережные: "embankment",
  пляж: "embankment",
  пространство: "space",
  пространства: "space",
};

export function interpretQuery(query: string) {
  const text = query.toLowerCase();
  const categories = Object.entries(CATEGORY_ALIASES)
    .filter(([alias]) => text.includes(alias))
    .map(([, category]) => category);

  return {
    categories: [...new Set(categories)],
    districts: matchDistrictQuery(query),
    onlyFresh: /сегодня|вчера|утром|свеж|за сутки|новое/i.test(query),
  };
}

export function filterItems(items: NewsItem[], query: string) {
  const parsed = interpretQuery(query);
  return items.filter((item) => {
    if (parsed.onlyFresh && item.freshness !== "today" && item.freshness !== "yesterday") {
      return false;
    }
    if (
      parsed.categories.length &&
      !item.categories.some((category) => parsed.categories.includes(category))
    ) {
      return false;
    }
    if (
      parsed.districts.length &&
      !item.districts.some((district) => parsed.districts.includes(district))
    ) {
      return false;
    }
    if (
      !parsed.categories.length &&
      !parsed.districts.length &&
      !parsed.onlyFresh
    ) {
      const haystack = `${item.title} ${item.excerpt} ${item.districts.join(" ")}`.toLowerCase();
      return query
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => token.length > 2)
        .every((token) => haystack.includes(token));
    }
    return true;
  });
}
