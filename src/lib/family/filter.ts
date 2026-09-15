import type { FamilyCategory, FamilyNewsItem } from "./types";

export const STRONG_PATTERNS: RegExp[] = [
  /многодетн/i,
  /маткапитал/i,
  /материнск\w*\s+капитал/i,
  /семейн\w*\s+ипотек/i,
  /единое\s+пособие/i,
  /семейн\w*\s+налогов\w*\s+выплат/i,
  /статус\w*\s+многодетн/i,
  /льгот\w*\s+многодетн/i,
];

const FAMILY_CONTEXT =
  /семь|семей|родител|многодетн|матер|дет(и|ей|ям|ский|ских|ское)/i;
const BENEFIT_CONTEXT =
  /пособи|выплат|льгот|компенсац|субсид|сертификат|ипотек|капитал|налогов\w*\s+выплат/i;

const NOISE_PATTERNS: RegExp[] = [
  /голосуйте реакц/i,
  /предлагаем три варианта/i,
  /слушайте подкаст/i,
  /на стриминговых платформах/i,
];

const CATEGORY_ALIASES: Record<string, FamilyCategory> = {
  жиль: "housing",
  ипотек: "housing",
  квартир: "housing",
  выплат: "payments",
  пособи: "payments",
  капитал: "payments",
  налог: "payments",
  школ: "school",
  сад: "school",
  детсад: "school",
  льгот: "family",
  семью: "family",
  семья: "family",
};

export function isNoise(text: string) {
  return NOISE_PATTERNS.some((pattern) => pattern.test(text));
}

export function matchesTopic(text: string) {
  const haystack = text.replace(/\s+/g, " ").trim();
  if (!haystack || isNoise(haystack)) return false;
  if (STRONG_PATTERNS.some((pattern) => pattern.test(haystack))) return true;
  return FAMILY_CONTEXT.test(haystack) && BENEFIT_CONTEXT.test(haystack);
}

export function categorize(text: string): FamilyCategory {
  if (/ипотек|жилищ|квартир|жиль/i.test(text)) return "housing";
  if (/школ|детск[а-яё]*\s+сад|детсад|образован/iu.test(text)) return "school";
  if (/пособи|выплат|капитал|налог/i.test(text)) return "payments";
  return "family";
}

export function whyFor(category: FamilyCategory) {
  if (category === "housing") return "Жильё, ипотека или улучшение условий";
  if (category === "payments") return "Выплаты, капитал или налоговые меры";
  if (category === "school") return "Школа, сад или образование детей";
  return "Семья, статус и льготы";
}

export function interpretFamilyQuery(query: string) {
  const text = query.toLowerCase();
  const categories = Object.entries(CATEGORY_ALIASES)
    .filter(([alias]) => text.includes(alias))
    .map(([, category]) => category);

  return {
    categories: [...new Set(categories)],
    onlyFresh: /(?:^|\s)(сегодня|вчера|утром|свежее|свежие|новое)(?:\s|$)/i.test(
      text,
    ),
  };
}

export function filterFamilyItems(items: FamilyNewsItem[], query: string) {
  const parsed = interpretFamilyQuery(query);
  return items.filter((item) => {
    if (
      parsed.onlyFresh &&
      item.freshness !== "today" &&
      item.freshness !== "yesterday"
    ) {
      return false;
    }
    if (parsed.categories.length && !parsed.categories.includes(item.category)) {
      return false;
    }
    if (!parsed.categories.length && !parsed.onlyFresh) {
      const haystack = `${item.title} ${item.excerpt}`.toLowerCase();
      return query
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => token.length > 2)
        .every((token) => haystack.includes(token));
    }
    return true;
  });
}
