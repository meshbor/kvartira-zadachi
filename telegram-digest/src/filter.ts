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

const FAMILY_CONTEXT = /семь|семей|родител|многодетн|матер|дет(и|ей|ям|ский|ских|ское)/i;
const BENEFIT_CONTEXT =
  /пособи|выплат|льгот|компенсац|субсид|сертификат|ипотек|капитал|налогов\w*\s+выплат/i;

export type DigestCategory = "Жильё" | "Выплаты" | "Школа и сад" | "Семья и льготы";

const NOISE_PATTERNS: RegExp[] = [
  /голосуйте реакц/i,
  /предлагаем три варианта/i,
  /слушайте подкаст/i,
  /на стриминговых платформах/i,
];

export function isNoise(text: string): boolean {
  return NOISE_PATTERNS.some((pattern) => pattern.test(text));
}

export function matchesTopic(text: string, extraKeywords: string[] = []): boolean {
  const haystack = text.replace(/\s+/g, " ").trim();
  if (!haystack || isNoise(haystack)) {
    return false;
  }

  if (STRONG_PATTERNS.some((pattern) => pattern.test(haystack))) {
    return true;
  }

  if (FAMILY_CONTEXT.test(haystack) && BENEFIT_CONTEXT.test(haystack)) {
    return true;
  }

  return extraKeywords.some((keyword) =>
    haystack.toLowerCase().includes(keyword.toLowerCase()),
  );
}

export function categorize(text: string): DigestCategory {
  if (/ипотек|жилищ|квартир|жиль/i.test(text)) {
    return "Жильё";
  }

  if (/школ|детск\w*\s+сад|детсад|образован/i.test(text)) {
    return "Школа и сад";
  }

  if (/пособи|выплат|капитал|налог/i.test(text)) {
    return "Выплаты";
  }

  return "Семья и льготы";
}
