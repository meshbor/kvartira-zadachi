export const FAMILY_CATEGORIES = [
  "housing",
  "payments",
  "school",
  "family",
] as const;

export type FamilyCategory = (typeof FAMILY_CATEGORIES)[number];

export type FamilyNewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  excerpt: string;
  category: FamilyCategory;
  freshness: "today" | "yesterday" | "week" | "older";
  why: string;
};

export type FamilyDigestResponse = {
  generatedAt: string;
  greeting: string;
  summary: string;
  todayLabel: string;
  lookbackHours: number;
  items: FamilyNewsItem[];
  freshCount: number;
  counts: Record<FamilyCategory, number>;
  warnings: string[];
};
