"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { QueueView } from "@/lib/queue/types";
import "./queue-kiosk.css";

export function OperatorWindow({ initial }: { initial: QueueView }) {
  const [view, setView] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = setInterval(async () => {
      const response = await fetch("/api/queue", { cache: "no-store" });
      const payload = (await response.json()) as { view: QueueView };
      setView(payload.view);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  async function invite() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next" }),
      });
      const payload = (await response.json()) as { view?: QueueView; error?: string };
      if (!response.ok || !payload.view) throw new Error(payload.error || "Не удалось вызвать");
      setView(payload.view);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка окна");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kiosk">
      <div className="kiosk-bezel">
        <header className="kiosk-top">
          <span>Окно оператора</span>
          <span>Алексей Пуликов</span>
          <span className="kiosk-top-actions">
            <Link href="/">к терминалу</Link>
            <button
              type="button"
              className="operator-logout"
              onClick={() => {
                void fetch("/api/queue/auth", { method: "DELETE" }).then(() => {
                  window.location.reload();
                });
              }}
            >
              выйти
            </button>
          </span>
        </header>
        <h1>Окно №1</h1>
        <p className="kiosk-sub">Вызов следующего посетителя. Очередь всё равно сама двигается раз в 6 минут.</p>
        <div className="kiosk-grid">
          <section className="led-board">
            <p className="led-label">Приглашён</p>
            <p className="led-code">{view.nowServing?.code ?? "---"}</p>
            <p className="led-name">{view.nowServing?.name || "нет посетителя у окна"}</p>
            <div className="led-strip">
              {view.waiting.map((ticket) => (
                <span key={ticket.code}>{ticket.code}</span>
              ))}
            </div>
          </section>
          <section className="kiosk-panel">
            <button type="button" className="kiosk-btn kiosk-btn-main" disabled={busy} onClick={() => void invite()}>
              Следующий
            </button>
            {error ? <p className="kiosk-error">{error}</p> : <p className="kiosk-mine">В очереди {view.waitingCount}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
