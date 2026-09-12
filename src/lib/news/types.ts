export const CATEGORIES = [
  "park",
  "playground",
  "space",
  "yard",
  "embankment",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Freshness = "today" | "yesterday" | "week" | "older";

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  excerpt: string;
  categories: Category[];
  districts: string[];
  freshness: Freshness;
  why: string;
};

export type DigestResponse = {
  generatedAt: string;
  greeting: string;
  summary: string;
  todayLabel: string;
  items: NewsItem[];
  freshCount: number;
  counts: Record<Category, number>;
  warnings: string[];
};

export type RawArticle = {
  title: string;
  url: string;
  source: string;
  publishedAt: Date | null;
  excerpt: string;
};
