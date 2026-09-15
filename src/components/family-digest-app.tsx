"use client";

import { useEffect, useRef, useState } from "react";
import { filterFamilyItems } from "@/lib/family/filter";
import { FAMILY_CATEGORY_LABELS, FRESHNESS_LABELS, formatPublishedAt } from "@/lib/labels";
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
    const items = filterFamilyItems(digest.items, trimmed);
    setMessages((current) => [
      ...current,
      { id: uid(), role: "user", text: trimmed },
      { id: uid(), role: "assistant", kind: "results", query: trimmed, items },
    ]);
    setSelected(items[0] ?? selected);
    setQuery("");
  }

  return (
    <div className="section-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Многодетные · выплаты, жильё, льготы</p>
          <h1>Семейные новости</h1>
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
            <div className="chip-list scroll-chips">
              {TOPIC_CHIPS.map((chip) => (
                <button key={chip.query} type="button" onClick={() => ask(chip.query)}>
                  {chip.label}
                  <em>
                    {chip.category ? digest.counts[chip.category] : digest.freshCount}
                  </em>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="chat-panel">
          <div className="thread" ref={threadRef}>
            {loading ? (
              <article className="bubble assistant">
                <p className="bubble-kicker">Утренний сбор</p>
                <p>Собираю новости про многодетных, выплаты и жильё…</p>
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
                  <article key={message.id} className="bubble assistant">
                    <p className="bubble-kicker">{message.digest.greeting}</p>
                    <p>
                      Собрали свежее по многодетным семьям: жильё, выплаты, сад, школа и льготы.
                    </p>
                    <p className="summary">{message.digest.summary}</p>
                    {message.digest.warnings.length ? (
                      <p className="muted">
                        Часть лент не открылась: {message.digest.warnings.join(" · ")}
                      </p>
                    ) : null}
                    <FamilyNewsList
                      items={message.digest.items.slice(0, 8)}
                      onOpen={setSelected}
                      selectedId={selected?.id}
                    />
                  </article>
                );
              }

              return (
                <article key={message.id} className="bubble assistant">
                  <p className="bubble-kicker">По запросу «{message.query}»</p>
                  {message.items.length ? (
                    <FamilyNewsList
                      items={message.items}
                      onOpen={setSelected}
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

        <aside className="detail" id="selected-panel">
          {selected ? (
            <section className="selected-card">
              <p className="bubble-kicker">Карточка новости</p>
              <h2>{selected.title}</h2>
              <p className="why">{selected.why}</p>
              {selected.excerpt ? <p>{selected.excerpt}</p> : null}
              <dl>
                <div>
                  <dt>Когда писали</dt>
                  <dd>{formatPublishedAt(selected.publishedAt)}</dd>
                </div>
                <div>
                  <dt>Источник</dt>
                  <dd>{selected.source}</dd>
                </div>
                <div>
                  <dt>Тема</dt>
                  <dd>{FAMILY_CATEGORY_LABELS[selected.category]}</dd>
                </div>
              </dl>
              <a className="open-source" href={selected.url} target="_blank" rel="noreferrer">
                Открыть новость
              </a>
            </section>
          ) : (
            <div className="empty-detail">
              <p>Выберите новость слева — справа откроется карточка с источником.</p>
            </div>
          )}

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
