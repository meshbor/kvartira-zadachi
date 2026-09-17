"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { QueueView, Ticket } from "@/lib/queue/types";
import "./queue-kiosk.css";

const STORAGE_KEY = "alexey-p-ticket";

type StoredTicket = { day: string; code: string; name: string };

function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function snapshotStorage() {
  return window.localStorage.getItem(STORAGE_KEY);
}

function parseStored(raw: string | null, day: string): StoredTicket | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredTicket;
    return parsed.day === day ? parsed : null;
  } catch {
    return null;
  }
}

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { cache: "no-store", ...init });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Ошибка терминала");
  }
  return payload;
}

function beep() {
  try {
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.12);
  } catch {
    // ignore
  }
}

export function QueueKiosk({
  initial,
  claimed = null,
}: {
  initial: QueueView;
  claimed?: Ticket | null;
}) {
  const [view, setView] = useState(initial);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [overlay, setOverlay] = useState<"none" | "signup" | "ticket" | "board">("none");
  const [printed, setPrinted] = useState<Ticket | null>(null);
  const [mine, setMine] = useState<StoredTicket | null>(
    claimed ? { day: initial.day, code: claimed.code, name: claimed.name } : null,
  );
  const storedRaw = useSyncExternalStore(subscribeStorage, snapshotStorage, () => null);
  const storedTicket = useMemo(() => parseStored(storedRaw, view.day), [storedRaw, view.day]);
  const activeTicket = mine?.day === view.day ? mine : storedTicket;
  const [clock, setClock] = useState("");

  useEffect(() => {
    if (!claimed) return;
    const stored = { day: initial.day, code: claimed.code, name: claimed.name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setMine(stored);
  }, [claimed, initial.day]);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("ru-RU", {
          timeZone: "Europe/Moscow",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    const timeout = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const payload = await readJson<{ view: QueueView }>("/api/queue");
        setView(payload.view);
      } catch {
        // keep last snapshot
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const myLookup = useMemo(() => {
    if (!activeTicket) return null;
    const ticket =
      view.nowServing?.code === activeTicket.code
        ? view.nowServing
        : view.waiting.find((item) => item.code === activeTicket.code) ||
          view.done.find((item) => item.code === activeTicket.code);
    if (!ticket) return null;
    const peopleAhead =
      ticket.status === "waiting"
        ? view.waiting.filter((item) => item.number < ticket.number).length +
          (view.nowServing ? 1 : 0)
        : 0;
    return { ticket, peopleAhead };
  }, [activeTicket, view]);

  function rememberTicket(day: string, ticket: Ticket) {
    const stored = { day, code: ticket.code, name: ticket.name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setMine(stored);
    setPrinted(ticket);
    setOverlay("ticket");
    beep();
  }

  async function issueTicket(visitorName: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: visitorName }),
      });
      const payload = (await response.json()) as {
        view?: QueueView;
        ticket?: Ticket;
        error?: string;
      };
      if (payload.view) setView(payload.view);
      if (payload.ticket) {
        rememberTicket(payload.view?.day ?? view.day, payload.ticket);
        if (!response.ok) setError(payload.error || "Талон уже выдан");
        return;
      }
      throw new Error(payload.error || "Ошибка терминала");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Терминал занят");
    } finally {
      setBusy(false);
    }
  }

  function openSignup() {
    setError("");
    if (myLookup?.ticket) {
      setPrinted(myLookup.ticket);
      setOverlay("ticket");
      return;
    }
    setOverlay("signup");
  }

  async function openBoard() {
    setBusy(true);
    setError("");
    try {
      const payload = await readJson<{ view: QueueView }>("/api/queue");
      setView(payload.view);
      setOverlay("board");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Табло недоступно");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kiosk">
      <div className="kiosk-bezel">
        <header className="kiosk-top">
          <span>Электронная очередь</span>
          <span>Окно №1 · Алексей Пуликов</span>
          <span>{clock} МСК</span>
        </header>

        <h1>Приём к Алексею Пуликову</h1>
        <p className="kiosk-sub">
          Терминал выдачи талонов. С одного устройства — один талон в день. Очередь двигает оператор.
        </p>

        <div className="kiosk-grid">
          <section className="led-board" aria-live="polite">
            <p className="led-label">Сейчас у окна</p>
            <p className="led-code">{view.nowServing?.code ?? "---"}</p>
            <p className="led-name">
              {view.nowServing
                ? view.nowServing.name || "посетитель"
                : "ожидайте вызова"}
            </p>
            <dl className="led-stats">
              <div>
                <dt>Ожидают</dt>
                <dd>{view.waitingCount}</dd>
              </div>
              <div>
                <dt>Последний талон</dt>
                <dd>{view.lastIssued?.code ?? "—"}</dd>
              </div>
              <div>
                <dt>Принято сегодня</dt>
                <dd>{view.doneCount}</dd>
              </div>
            </dl>
            <div className="led-strip" aria-label="Очередь">
              {view.waiting.length === 0 && !view.nowServing ? (
                <span className="led-empty">Очередь пуста</span>
              ) : (
                <>
                  {view.nowServing ? (
                    <em key={view.nowServing.code}>{view.nowServing.code}</em>
                  ) : null}
                  {view.waiting.map((ticket) => (
                    <span key={ticket.code}>{ticket.code}</span>
                  ))}
                </>
              )}
            </div>
          </section>

          <section className="kiosk-panel">
            <button
              type="button"
              className="kiosk-btn kiosk-btn-main"
              disabled={busy}
              onClick={() => openSignup()}
            >
              {activeTicket ? "Мой талон" : "Записаться"}
            </button>
            <button
              type="button"
              className="kiosk-btn kiosk-btn-alt"
              disabled={busy}
              onClick={() => void openBoard()}
            >
              Проверить очередь
            </button>
            {myLookup ? (
              <p className="kiosk-mine">
                Ваш талон <strong>{myLookup.ticket.code}</strong>
                {myLookup.ticket.status === "serving"
                  ? " — вас пригласили к окну"
                  : myLookup.ticket.status === "done"
                    ? " — визит завершён"
                    : ` — перед вами ${myLookup.peopleAhead}`}
              </p>
            ) : (
              <p className="kiosk-mine">Возьмите талон и следите за табло.</p>
            )}
            {error ? <p className="kiosk-error">{error}</p> : null}
          </section>
        </div>

        {overlay !== "none" ? (
          <div className="kiosk-modal" role="dialog" aria-modal="true">
            <div className="kiosk-modal-card">
              {overlay === "signup" ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void issueTicket(name);
                  }}
                >
                  <p className="modal-kicker">Новый талон</p>
                  <h2>Как к вам обращаться?</h2>
                  <p className="board-you">Повторно талон с этого телефона сегодня не выдаётся.</p>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Имя или команда, необязательно"
                    maxLength={32}
                    autoFocus
                  />
                  <div className="modal-actions">
                    <button type="submit" className="kiosk-btn kiosk-btn-main" disabled={busy}>
                      {busy ? "Печать…" : "Получить талон"}
                    </button>
                    <button
                      type="button"
                      className="kiosk-btn kiosk-btn-ghost"
                      disabled={busy}
                      onClick={() => void issueTicket("")}
                    >
                      Без имени
                    </button>
                  </div>
                </form>
              ) : null}

              {overlay === "ticket" && printed ? (
                <div className="ticket-wrap">
                  <article className="ticket">
                    <p>Электронная очередь · окно №1</p>
                    <strong>{printed.code}</strong>
                    <span>{printed.name || "посетитель"}</span>
                    <em>Приём к Алексею Пуликову</em>
                    <div className="ticket-bar" />
                    <small>Сохраните талон. Очередь сбрасывается в 00:00 МСК.</small>
                  </article>
                  <button
                    type="button"
                    className="kiosk-btn kiosk-btn-main"
                    onClick={() => setOverlay("none")}
                  >
                    Готово
                  </button>
                </div>
              ) : null}

              {overlay === "board" ? (
                <div className="board-wrap">
                  <p className="modal-kicker">Табло очереди</p>
                  <h2>Проверить очередь</h2>
                  {myLookup ? (
                    <p className="board-you">
                      {myLookup.ticket.status === "serving"
                        ? `Талон ${myLookup.ticket.code}: проходите к окну.`
                        : myLookup.ticket.status === "done"
                          ? `Талон ${myLookup.ticket.code} уже вызван.`
                          : `Талон ${myLookup.ticket.code}: перед вами ${myLookup.peopleAhead}.`}
                    </p>
                  ) : (
                    <p className="board-you">Сегодня выдано {view.issuedCount} талонов.</p>
                  )}
                  <ol className="board-list">
                    {view.nowServing ? (
                      <li className="is-now">
                        <b>{view.nowServing.code}</b>
                        <span>{view.nowServing.name || "посетитель"}</span>
                        <em>у окна</em>
                      </li>
                    ) : null}
                    {view.waiting.map((ticket, index) => (
                      <li key={ticket.code} className={activeTicket?.code === ticket.code ? "is-mine" : undefined}>
                        <b>{ticket.code}</b>
                        <span>{ticket.name || "посетитель"}</span>
                        <em>ещё {index + (view.nowServing ? 1 : 0)}</em>
                      </li>
                    ))}
                  </ol>
                  {view.waiting.length === 0 && !view.nowServing ? (
                    <p className="board-you">Очередь пуста — можно записываться первым.</p>
                  ) : null}
                  <button
                    type="button"
                    className="kiosk-btn kiosk-btn-alt"
                    onClick={() => setOverlay("none")}
                  >
                    Закрыть
                  </button>
                </div>
              ) : null}

              {overlay !== "ticket" ? (
                <button type="button" className="modal-close" onClick={() => setOverlay("none")}>
                  Назад
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <footer className="kiosk-foot">
          <span>Очередь обнуляется каждый день в 00:00 МСК · один талон с устройства в сутки</span>
        </footer>
      </div>
    </div>
  );
}
