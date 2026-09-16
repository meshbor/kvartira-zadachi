"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DigestApp } from "@/components/digest-app";
import { FamilyDigestApp } from "@/components/family-digest-app";
import type { FamilyDigestResponse } from "@/lib/family/types";
import type { DigestResponse } from "@/lib/news/types";

const TABS = [
  { id: "family", label: "Многодетные", short: "Семья" },
  { id: "spaces", label: "Новые пространства", short: "Прогулки" },
] as const;

export type HubTab = (typeof TABS)[number]["id"];

function isTab(value: string | null): value is HubTab {
  return TABS.some((tab) => tab.id === value);
}

export function Hub({
  familyDigest,
  spacesDigest,
  initialTab,
}: {
  familyDigest: FamilyDigestResponse;
  spacesDigest: DigestResponse;
  initialTab?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: HubTab = isTab(searchParams.get("tab"))
    ? (searchParams.get("tab") as HubTab)
    : isTab(initialTab ?? null)
      ? (initialTab as HubTab)
      : "family";

  function openTab(next: HubTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="app-shell">
      <nav className="site-tabs" aria-label="Разделы">
        <strong className="site-brand">digest</strong>
        <div className="tab-list" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "is-active" : undefined}
              onClick={() => openTab(item.id)}
            >
              {item.label === item.short ? (
                item.label
              ) : (
                <>
                  <span className="tab-full">{item.label}</span>
                  <span className="tab-short">{item.short}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div role="tabpanel">
        {tab === "family" ? <FamilyDigestApp initialDigest={familyDigest} /> : null}
        {tab === "spaces" ? <DigestApp initialDigest={spacesDigest} /> : null}
      </div>
    </div>
  );
}
