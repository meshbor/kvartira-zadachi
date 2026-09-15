"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DigestToolbar } from "@/components/digest-toolbar";
import { MobileSheet } from "@/components/mobile-sheet";
import { filterFamilyItems } from "@/lib/family/filter";
import { FAMILY_CATEGORY_LABELS, FRESHNESS_LABELS, formatPublishedAt } from "@/lib/labels";
import { itemMentionsSpbLenobl } from "@/lib/region";
import type { FamilyCategory, FamilyDigestResponse, FamilyNewsItem } from "@/lib/family/types";

type ChatMessage =
  | { id: string; role: "assistant"; kind: "intro"; digest: FamilyDigestResponse }
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      kind: "results";
      query: string;
      items: FamilyNewsItem[];
    };

const TOPIC_CHIPS: { label: string; query: string; category?: FamilyCategory }[] = [
  { label: "Что нового", query: "свежее сегодня" },
  { label: "Жильё", query: "жильё", category: "housing" },
  { label: "Выплаты", query: "выплаты", category: "payments" },
  { label: "Школа и сад", query: "школа", category: "school" },
  { label: "Семья и льготы", query: "льготы", category: "family" },
];

const HELP_LINKS = [
  {
    title: "Госуслуги: многодетная семья",
    href: "https://www.gosuslugi.ru/",
    note: "Статус, пособия и заявления",
  },
  {
    title: "Социальный фонд",
    href: "https://sfr.gov.ru/press_center/news/",
    note: "Официальные новости выплат",
  },
  {
    title: "Семейная ипотека",
    href: "https://xn--80aapampemcchfmo7a3c9ehj.xn--p1ai/new-projects/",
    note: "Как устроена поддержка жилья",
  },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function FamilyDigestApp({
  initialDigest,
}: {
  initialDigest: FamilyDigestResponse;
}) {
  const [digest, setDigest] = useState(initialDigest);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "intro", role: "assistant", kind: "intro", digest: initialDigest },
  ]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FamilyNewsItem | null>(
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
      const response = await fetch("/api/family-digest", { cache: "no-store" });
      if (!response.ok) throw new Error("Сервер не ответил");
      const data = (await response.json()) as FamilyDigestResponse;
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

  const regionalItems = regionOn
    ? digest.items.filter((item) => itemMentionsSpbLenobl(item))
    : digest.items;

  const counts = useMemo(() => {
    const next = { housing: 0, payments: 0, school: 0, family: 0 };
    for (const item of regionalItems) next[item.category] += 1;
    return next;
  }, [regionalItems]);

  const freshCount = regionalItems.filter(
    (item) => item.freshness === "today" || item.freshness === "yesterday",
  ).length;

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const items = filterFamilyItems(regionalItems, trimmed);
    setMessages((current) => [
      ...current,
      { id: uid(), role: "user", text: trimmed },
      { id: uid(), role: "assistant", kind: "results", query: trimmed, items },
    ]);
    setSelected(items[0] ?? selected);
    setQuery("");
  }

  function openItem(item: FamilyNewsItem) {
    setSelected(item);
    setSheetOpen(true);
  }

  function toggleRegion() {
    setRegionOn((current) => !current);
    setMessages([{ id: "intro", role: "assistant", kind: "intro", digest }]);
  }

  return (
    <div className="section-shell">
      <DigestToolbar
        description="Многодетные: выплаты, жильё, льготы"
        regionOn={regionOn}
        onRegionToggle={toggleRegion}
        onRefresh={() => void loadDigest()}
      />

      <div className="workspace">
        <aside className="rail">
          <section>
            <div className="chip-list scroll-chips">
              {TOPIC_CHIPS.map((chip) => (
                <button key={chip.query} type="button" onClick={() => ask(chip.query)}>
                  {chip.label}
                  <em>
                    {chip.category ? counts[chip.category] : freshCount}
                  </em>
                </button>
              ))}
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
                  <FamilyNewsList
                    key={message.id}
                    items={regionalItems}
                    onOpen={openItem}
                    selectedId={selected?.id}
                  />
                );
              }

              return (
                <article key={message.id} className="bubble assistant">
                  <p className="bubble-kicker">«{message.query}»</p>
                  {message.items.length ? (
                    <FamilyNewsList
                      items={message.items}
                      onOpen={openItem}
                      selectedId={selected?.id}
                    />
                  ) : (
                    <p>В свежей ленте этого нет. Попробуйте другую тему.</p>
                  )}
                </article>
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
              placeholder="Спросите: ипотека, маткапитал, единое пособие"
              aria-label="Сообщение в дайджест"
            />
            <button type="submit">Спросить</button>
          </form>
        </main>

        <aside className="detail keep-on-mobile" id="selected-panel">
          <div className="desktop-only-detail">
            {selected ? (
              <FamilySelectedCard item={selected} />
            ) : (
              <div className="empty-detail">
                <p>Выберите новость в списке — откроется карточка с источником.</p>
              </div>
            )}
          </div>

          <section className="maps">
            <h2>Куда сходить за справкой</h2>
            {HELP_LINKS.map((link) => (
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
        title="Карточка новости"
      >
        {selected ? <FamilySelectedCard item={selected} /> : null}
      </MobileSheet>
    </div>
  );
}

function FamilyNewsList({
  items,
  onOpen,
  selectedId,
}: {
  items: FamilyNewsItem[];
  onOpen: (item: FamilyNewsItem) => void;
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

function FamilySelectedCard({ item }: { item: FamilyNewsItem }) {
  return (
    <section className="selected-card">
      <p className="bubble-kicker">Карточка новости</p>
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
          <dt>Тема</dt>
          <dd>{FAMILY_CATEGORY_LABELS[item.category]}</dd>
        </div>
      </dl>
      <a className="open-source" href={item.url} target="_blank" rel="noreferrer">
        Открыть новость
      </a>
    </section>
  );
}
