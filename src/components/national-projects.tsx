"use client";

import { useMemo, useState } from "react";
import { DigestToolbar } from "@/components/digest-toolbar";
import { MobileSheet } from "@/components/mobile-sheet";
import {
  NATIONAL_PROJECTS,
  PROJECT_GROUPS,
  PROJECT_SOURCES,
  RELATED_PROGRAMS,
  type NationalProject,
  type ProjectGroupId,
} from "@/lib/projects/data";
import { budgetFor, formatBillionRub } from "@/lib/projects/budget";
import { filterProjects } from "@/lib/projects/search";

export function NationalProjectsApp() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(NATIONAL_PROJECTS[0].id);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(
    () => filterProjects(query, "all"),
    [query],
  );

  const selected =
    filtered.find((project) => project.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="section-shell">
      <DigestToolbar description="Нацпроекты 2025–2030, 20 штук" />

      <div className="workspace workspace-projects">
        <main className="chat-panel">
          {/* TODO(search): вернуть поиск по нацпроектам, когда появится разбор федеральных проектов и компаний. */}
          <form
            className="composer is-parked"
            onSubmit={(event) => event.preventDefault()}
            hidden
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Искать: семья, данные, дроны, ипотека"
              aria-label="Поиск по нацпроектам"
            />
          </form>
          <div className="thread">
            {filtered.length ? (
              <div className="news-list">
                {filtered.map((project) => {
                  const budget = budgetFor(project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      className={project.id === selected?.id ? "news-card active" : "news-card"}
                      onClick={() => {
                        setSelectedId(project.id);
                        setSheetOpen(true);
                      }}
                      aria-haspopup="dialog"
                    >
                      <div className="news-meta">
                        <span className="fresh">{groupLabel(project.group)}</span>
                        {budget ? (
                          <span className="budget-pill">{formatBillionRub(budget.totalBillion)}</span>
                        ) : null}
                      </div>
                      <strong>{project.title}</strong>
                      <p>{project.goal}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="muted feed-status">
                Ничего не нашлось. Сбросьте поиск или выберите другую цель.
              </p>
            )}
          </div>
        </main>

        <aside className="detail keep-on-mobile">
          <div className="desktop-only-detail">
            {selected ? <ProjectCard project={selected} /> : (
              <div className="empty-detail">
                <p>Выберите проект в списке — откроется карточка.</p>
              </div>
            )}
          </div>
          <section className="maps">
            <h2>Источники</h2>
            {PROJECT_SOURCES.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                <strong>{link.title}</strong>
                <span>Официальные материалы</span>
              </a>
            ))}
            {RELATED_PROGRAMS.map((item) => (
              <div key={item.title} className="related-note">
                <strong>{item.title}</strong>
                <span>{item.note}</span>
              </div>
            ))}
          </section>
        </aside>
      </div>

      <MobileSheet
        open={sheetOpen && Boolean(selected)}
        onClose={() => setSheetOpen(false)}
        title="Карточка проекта"
      >
        {selected ? <ProjectCard project={selected} /> : null}
      </MobileSheet>
    </div>
  );
}

function groupLabel(id: ProjectGroupId) {
  return PROJECT_GROUPS.find((group) => group.id === id)?.title ?? id;
}

function ProjectCard({ project }: { project: NationalProject }) {
  const budget = budgetFor(project.id);
  return (
    <section className="selected-card">
      <p className="bubble-kicker">{groupLabel(project.group)}</p>
      <h2>{project.title}</h2>
      <p className="why">{project.goal}</p>
      <dl>
        <div>
          <dt>Общий бюджет</dt>
          <dd>
            {budget ? formatBillionRub(budget.totalBillion) : "не опубликован"}
            {budget?.federalBillion != null || budget?.extraBillion ? (
              <span className="budget-split">
                {budget.federalBillion
                  ? ` ФБ ${formatBillionRub(budget.federalBillion)}`
                  : ""}
                {budget.extraBillion
                  ? ` · внебюджет ${formatBillionRub(budget.extraBillion)}`
                  : ""}
              </span>
            ) : null}
          </dd>
        </div>
        {budget ? (
          <div>
            <dt>Откуда цифра</dt>
            <dd>{budget.source}</dd>
          </div>
        ) : null}
        <div>
          <dt>Куратор в Правительстве</dt>
          <dd>{project.curator}</dd>
        </div>
        <div>
          <dt>Ответственный ФОИВ</dt>
          <dd>{project.agency}</dd>
        </div>
        <div>
          <dt>Руководитель</dt>
          <dd>{project.lead}</dd>
        </div>
      </dl>
      <h3>Федеральные проекты</h3>
      <ul>
        {project.federalProjects.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3>Что делают</h3>
      <ul>
        {project.highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3>Ориентиры к 2030</h3>
      <ul>
        {project.indicators.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3>Где может пригодиться IT</h3>
      <ul>
        {project.itHooks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
