export const FAMILY_GOOGLE_QUERIES = [
  { id: "large-family", query: "многодетные семьи льготы Россия" },
  { id: "maternity-capital", query: "материнский капитал" },
  { id: "family-mortgage", query: "семейная ипотека многодетные" },
  { id: "unified-benefit", query: "единое пособие семьи" },
  { id: "family-status", query: "статус многодетной семьи" },
] as const;

export const FAMILY_RSS_FEEDS = [
  { id: "ria", name: "РИА Новости", url: "https://ria.ru/export/rss2/index.xml" },
  { id: "tass", name: "ТАСС", url: "https://tass.ru/rss/v2.xml" },
  { id: "interfax", name: "Интерфакс", url: "https://www.interfax.ru/rss" },
  { id: "klerk", name: "Клерк", url: "https://www.klerk.ru/export/news.rss" },
] as const;
