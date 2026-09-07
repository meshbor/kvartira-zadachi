export type SourceKind = "rss" | "telegram" | "html";

export type DigestItem = {
  title: string;
  url: string;
  source: string;
  sourceId: string;
  kind: SourceKind;
  publishedAt: Date | null;
  snippet: string;
};

export type SourceError = {
  sourceId: string;
  source: string;
  message: string;
};

export type RssSource = {
  id: string;
  name: string;
  url: string;
};

export type TelegramSource = {
  id: string;
  name: string;
  username: string;
};

export type HtmlSource = {
  id: string;
  name: string;
  url: string;
  itemSelector: string;
  titleSelector: string;
  linkSelector: string;
  dateSelector?: string;
  snippetSelector?: string;
};

export type SourcesFile = {
  rss: RssSource[];
  telegram: TelegramSource[];
  html: HtmlSource[];
};
