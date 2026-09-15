"use client";

export function DigestToolbar({
  description,
  regionOn,
  onRegionToggle,
  onRefresh,
}: {
  description: string;
  regionOn?: boolean;
  onRegionToggle?: () => void;
  onRefresh?: () => void;
}) {
  return (
    <header className="topbar">
      <p className="eyebrow">{description}</p>
      <div className="topbar-meta">
        {onRegionToggle ? (
          <button
            type="button"
            className={regionOn ? "filter-chip is-active" : "filter-chip"}
            aria-pressed={regionOn}
            onClick={onRegionToggle}
          >
            СПб · ЛО
          </button>
        ) : null}
        {onRefresh ? (
          <button
            type="button"
            className="icon-button"
            onClick={onRefresh}
            aria-label="Обновить ленту"
          >
            <RefreshIcon />
          </button>
        ) : null}
      </div>
    </header>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a5 5 0 1 1-4.9 6.08L6.11 14.1A7 7 0 1 0 19 12c0-1.93-.78-3.68-2.05-4.95z"
      />
    </svg>
  );
}
