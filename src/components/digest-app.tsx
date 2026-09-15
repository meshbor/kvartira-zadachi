"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { filterItems } from "@/lib/news/filter";
import { CATEGORY_LABELS, FRESHNESS_LABELS, formatPublishedAt } from "@/lib/labels";
import { DISTRICTS } from "@/lib/news/districts";
import type { Category, DigestResponse, NewsItem } from "@/lib/news/types";

type ChatMessage =
  | { id: string; role: "assistant"; kind: "intro"; digest: DigestResponse }
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; kind: "results"; query: string; items: NewsItem[] };

const TOPIC_CHIPS: { label: string; query: string }[] = [
  { label: "Что нового", query: "свежее сегодня" },
  { label: "Парки", query: "парки" },
  { label: "Площадки", query: "площадки" },
  { label: "Дворы", query: "дворы" },
  { label: "Набережные", query: "набережные" },
];

const MAP_LINKS = [
  {
    title: "Парки на Яндекс Картах",
    href: "https://yandex.ru/maps/2/saint-petersburg/category/park/",
    note: "Быстро прикинуть, куда доехать",
  },
  {
    title: "Детские площадки на 2ГИС",
    href: "https://2gis.ru/spb/search/%D0%B4%D0%B5%D1%82%D1%81%D0%BA%D0%B0%D1%8F%20%D0%BF%D0%BB%D0%BE%D1%89%D0%B0%D0%B4%D0%BA%D0%B0",
    note: "Удобно смотреть рядом с домом",
  },
  {
    title: "Официальные новости города",
    href: "https://www.gov.spb.ru/press/",
    note: "Открытия парков и дворов",
  },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const TOPIC_COUNTS: Record<string, Category> = {
  парки: "park",
  площадки: "playground",
  дворы: "yard",
  набережные: "embankment",
};

function topicCount(query: string, digest: DigestResponse) {
  if (query.includes("свеж")) return digest.freshCount;
  const category = TOPIC_COUNTS[query];
  return category ? digest.counts[category] : 0;
}

export function DigestApp({ initialDigest }: { initialDigest: DigestResponse }) {
  const [digest, setDigest] = useState<DigestResponse>(initialDigest);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "intro", role: "assistant", kind: "intro", digest: initialDigest },
  ]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<NewsItem | null>(
    initialDigest.items[0] ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  async function loadDigest() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/digest", { cache: "no-store" });
      if (!response.ok) throw new Error("Сервер не ответил");
      const data = (await response.json()) as DigestResponse;
      setDigest(data);
      setMessages([{ id: uid(), role: "assistant", kind: "intro", digest: data }]);
      setSelected(data.items[0] ?? null);
    } catch {
      setError("Не получилось загрузить утреннюю ленту. Проверьте сеть и обновите.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const items = filterItems(digest.items, trimmed);
    setMessages((current) => [
      ...current,
      { id: uid(), role: "user", text: trimmed },
      { id: uid(), role: "assistant", kind: "results", query: trimmed, items },
    ]);
    setSelected(items[0] ?? selected);
    setQuery("");
  }

  const visibleItems = useMemo(() => digest.items, [digest]);

  return (
    <div className="section-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Новые пространства · парки, дворы, площадки Петербурга</p>
          <h1>Гуляй, СПб</h1>
        </div>
        <div className="topbar-meta">
          <span>{digest.todayLabel}</span>
          <button type="button" className="ghost-button" onClick={() => void loadDigest()}>
            Обновить ленту
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="rail">
          <section>
            <h2>Темы утра</h2>
            <div className="chip-list">
              {TOPIC_CHIPS.map((chip) => (
                <button key={chip.query} type="button" onClick={() => ask(chip.query)}>
                  {chip.label}
                  <em>{topicCount(chip.query, digest)}</em>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2>Районы</h2>
            <div className="district-list">
              {DISTRICTS.map((district) => {
                const count = visibleItems.filter((item) =>
                  item.districts.includes(district),
                ).length;
                return (
                  <button
                    key={district}
                    type="button"
                    disabled={!count}
                    onClick={() => ask(district)}
                  >
                    <span>{district}</span>
                    <span>{count || "—"}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>

        <main className="chat-panel">
          <div className="thread" ref={threadRef}>
            {loading ? (
              <article className="bubble assistant">
                <p className="bubble-kicker">Утренний сбор</p>
                <p>Собираю, что нового появилось в парках, дворах и на площадках Петербурга…</p>
              </article>
            ) : null}

            {error ? (
              <article className="bubble assistant warning">
                <p>{error}</p>
              </article>
            ) : null}

            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <article key={message.id} className="bubble user">
                    <p>{message.text}</p>
                  </article>
                );
              }

              if (message.kind === "intro") {
                return (
                  <IntroBubble
                    key={message.id}
                    digest={message.digest}
                    onOpen={setSelected}
                    selectedId={selected?.id}
                  />
                );
              }

              return (
                <ResultsBubble
                  key={message.id}
                  query={message.query}
                  items={message.items}
                  onOpen={setSelected}
                  selectedId={selected?.id}
                />
              );
            })}
          </div>

          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              ask(query);
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Спросите: парки в Приморском, площадки, что нового сегодня"
              aria-label="Сообщение в дайджест"
            />
            <button type="submit">Спросить</button>
          </form>
        </main>

        <aside className="detail">
          {selected ? (
            <SelectedCard item={selected} />
          ) : (
            <div className="empty-detail">
              <p>Выберите новость слева — справа откроется карточка с источником и районом.</p>
            </div>
          )}

          <section className="maps">
            <h2>Куда посмотреть карту</h2>
            {MAP_LINKS.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                <strong>{link.title}</strong>
                <span>{link.note}</span>
              </a>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

function IntroBubble({
  digest,
  onOpen,
  selectedId,
}: {
  digest: DigestResponse;
  onOpen: (item: NewsItem) => void;
  selectedId?: string;
}) {
  return (
    <article className="bubble assistant">
      <p className="bubble-kicker">{digest.greeting}</p>
      <p>
        Собрали актуальное по Петербургу: парки, общественные пространства, дворы и места, где
        можно выгулять детей.
      </p>
      <p className="summary">{digest.summary}</p>
      {digest.warnings.length ? (
        <p className="muted">Часть лент не открылась: {digest.warnings.join(" · ")}</p>
      ) : null}
      <NewsList items={digest.items.slice(0, 8)} onOpen={onOpen} selectedId={selectedId} />
    </article>
  );
}

function ResultsBubble({
  query,
  items,
  onOpen,
  selectedId,
}: {
  query: string;
  items: NewsItem[];
  onOpen: (item: NewsItem) => void;
  selectedId?: string;
}) {
  return (
    <article className="bubble assistant">
      <p className="bubble-kicker">По запросу «{query}»</p>
      {items.length ? (
        <NewsList items={items} onOpen={onOpen} selectedId={selectedId} />
      ) : (
        <p>В свежей ленте этого нет. Попробуйте другую тему или район.</p>
      )}
    </article>
  );
}

function NewsList({
  items,
  onOpen,
  selectedId,
}: {
  items: NewsItem[];
  onOpen: (item: NewsItem) => void;
  selectedId?: string;
}) {
  return (
    <div className="news-list">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === selectedId ? "news-card active" : "news-card"}
          onClick={() => onOpen(item)}
        >
          <div className="news-meta">
            <span className={`fresh ${item.freshness}`}>{FRESHNESS_LABELS[item.freshness]}</span>
            <span>{item.source}</span>
          </div>
          <strong>{item.title}</strong>
          <p>{item.why}</p>
        </button>
      ))}
    </div>
  );
}

function SelectedCard({ item }: { item: NewsItem }) {
  return (
    <section className="selected-card">
      <p className="bubble-kicker">Карточка места</p>
      <h2>{item.title}</h2>
      <p className="why">{item.why}</p>
      {item.excerpt ? <p>{item.excerpt}</p> : null}
      <dl>
        <div>
          <dt>Когда писали</dt>
          <dd>{formatPublishedAt(item.publishedAt)}</dd>
        </div>
        <div>
          <dt>Источник</dt>
          <dd>{item.source}</dd>
        </div>
        <div>
          <dt>Район</dt>
          <dd>{item.districts.join(", ") || "Петербург"}</dd>
        </div>
        <div>
          <dt>Тема</dt>
          <dd>{item.categories.map((category) => CATEGORY_LABELS[category]).join(", ")}</dd>
        </div>
      </dl>
      <a className="open-source" href={item.url} target="_blank" rel="noreferrer">
        Открыть новость
      </a>
    </section>
  );
}
