"use client";

import { useEffect, useRef, useState } from "react";
import { DigestToolbar } from "@/components/digest-toolbar";
import { MobileSheet } from "@/components/mobile-sheet";
import { filterItems } from "@/lib/news/filter";
import { CATEGORY_LABELS, FRESHNESS_LABELS, formatPublishedAt } from "@/lib/labels";
import { DISTRICTS } from "@/lib/news/districts";
import { itemMentionsSpbLenobl } from "@/lib/region";
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

function topicCount(query: string, items: NewsItem[], freshCount: number) {
  if (query.includes("свеж")) return freshCount;
  const category = TOPIC_COUNTS[query];
  return category ? items.filter((item) => item.categories.includes(category)).length : 0;
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [regionOn, setRegionOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  async function loadDigest() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/digest?fresh=1", { cache: "no-store" });
      if (!response.ok) throw new Error("Сервер не ответил");
      const data = (await response.json()) as DigestResponse;
      setDigest(data);
      setMessages([{ id: uid(), role: "assistant", kind: "intro", digest: data }]);
      setSelected(data.items[0] ?? null);
      setSheetOpen(false);
    } catch {
      setError("Не получилось загрузить утреннюю ленту. Проверьте сеть и обновите.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (messages.length <= 1) return;
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const items = filterItems(regionalItems, trimmed);
    setMessages((current) => [
      ...current,
      { id: uid(), role: "user", text: trimmed },
      { id: uid(), role: "assistant", kind: "results", query: trimmed, items },
    ]);
    setSelected(items[0] ?? selected);
    setQuery("");
  }

  function openItem(item: NewsItem) {
    setSelected(item);
    setSheetOpen(true);
  }

  function toggleRegion() {
    setRegionOn((current) => !current);
    setMessages([{ id: "intro", role: "assistant", kind: "intro", digest }]);
  }

  const regionalItems = regionOn
    ? digest.items.filter((item) => itemMentionsSpbLenobl(item))
    : digest.items;

  const visibleItems = regionalItems;

  return (
    <div className="section-shell">
      <DigestToolbar
        description="Парки, дворы и площадки Петербурга"
        regionOn={regionOn}
        onRegionToggle={toggleRegion}
        onRefresh={() => void loadDigest()}
        refreshing={loading}
      />

      <div className="workspace">
        <aside className="rail">
          <section>
            <div className="chip-list scroll-chips">
              {TOPIC_CHIPS.map((chip) => (
                <button key={chip.query} type="button" onClick={() => ask(chip.query)}>
                  {chip.label}
                  <em>
                    {topicCount(
                      chip.query,
                      regionalItems,
                      regionalItems.filter(
                        (item) => item.freshness === "today" || item.freshness === "yesterday",
                      ).length,
                    )}
                  </em>
                </button>
              ))}
            </div>
          </section>

          <section className="district-block">
            <div className="district-list scroll-chips">
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
            {loading ? <p className="muted feed-status">Обновляю ленту…</p> : null}

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
                if (!regionalItems.length) {
                  return (
                    <p key={message.id} className="muted feed-status">
                      {regionOn
                        ? "По СПб и Ленобласти пока пусто. Снимите фильтр или обновите."
                        : "Пока нет свежих новостей."}
                    </p>
                  );
                }
                return (
                  <NewsList
                    key={message.id}
                    items={regionalItems}
                    onOpen={openItem}
                    selectedId={selected?.id}
                  />
                );
              }

              return (
                <ResultsBubble
                  key={message.id}
                  query={message.query}
                  items={message.items}
                  onOpen={openItem}
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

        <aside className="detail keep-on-mobile" id="selected-panel">
          <div className="desktop-only-detail">
            {selected ? (
              <SelectedCard item={selected} />
            ) : (
              <div className="empty-detail">
                <p>Выберите новость в списке — откроется карточка с источником и районом.</p>
              </div>
            )}
          </div>

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

      <MobileSheet
        open={sheetOpen && Boolean(selected)}
        onClose={() => setSheetOpen(false)}
        title="Карточка места"
      >
        {selected ? <SelectedCard item={selected} /> : null}
      </MobileSheet>
    </div>
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
          aria-haspopup="dialog"
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
