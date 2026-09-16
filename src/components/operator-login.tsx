"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import "./queue-kiosk.css";

export function OperatorLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/queue/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Неверный пароль");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неверный пароль");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kiosk">
      <div className="kiosk-bezel">
        <header className="kiosk-top">
          <span>Служебный вход</span>
          <span>Алексей Пуликов</span>
          <Link href="/" style={{ color: "inherit" }}>
            к терминалу
          </Link>
        </header>
        <h1>Окно №1</h1>
        <p className="kiosk-sub">Только для Алексея. Команде этот экран не нужен.</p>
        <form className="kiosk-panel" onSubmit={(event) => void submit(event)}>
          <label htmlFor="operator-password">Пароль окна</label>
          <input
            id="operator-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            autoFocus
          />
          <button type="submit" className="kiosk-btn kiosk-btn-main" disabled={busy}>
            {busy ? "Проверяем…" : "Войти"}
          </button>
          {error ? <p className="kiosk-error">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
