"use client";

import { useMemo, useState } from "react";
import {
  NATIONAL_PROJECTS,
  PROJECT_GROUPS,
  PROJECT_SOURCES,
  RELATED_PROGRAMS,
  type NationalProject,
  type ProjectGroupId,
} from "@/lib/projects/data";
import { BUDGET_NOTE, budgetFor, formatBillionRub } from "@/lib/projects/budget";
import { filterProjects } from "@/lib/projects/search";

export function NationalProjectsApp() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<ProjectGroupId | "all">("all");
  const [selectedId, setSelectedId] = useState(NATIONAL_PROJECTS[0].id);

  const filtered = useMemo(
    () => filterProjects(query, group),
    [group, query],
  );

  const selected =
    filtered.find((project) => project.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="section-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">2025–2030 · 20 нацпроектов, без IT-идей пока</p>
          <h1>Национальные проекты</h1>
        </div>
        <div className="topbar-meta">
          <span>{NATIONAL_PROJECTS.length} проектов</span>
        </div>
      </header>

      <div className="workspace">
        <aside className="rail">
          <section>
            <h2>Национальные цели</h2>
            <div className="chip-list scroll-chips">
              <button
                type="button"
                className={group === "all" ? "is-active" : undefined}
                onClick={() => setGroup("all")}
              >
                Все
                <em>{NATIONAL_PROJECTS.length}</em>
              </button>
              {PROJECT_GROUPS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={group === item.id ? "is-active" : undefined}
                  onClick={() => setGroup(item.id)}
                >
                  {item.title}
                  <em>
                    {NATIONAL_PROJECTS.filter((project) => project.group === item.id).length}
                  </em>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="chat-panel">
          <form
            className="composer"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Искать: семья, данные, дроны, ипотека"
              aria-label="Поиск по нацпроектам"
            />
          </form>
          <div className="thread">
            <article className="bubble assistant">
              <p className="bubble-kicker">Структурированный список</p>
              <p>
                Собрали новые нацпроекты цикла 2025–2030: цель, федеральные проекты внутри,
                ключевые меры и крючки для IT. Идеи сервисов — следующим шагом, сейчас только
                карта поля.
              </p>
              <p className="summary">
                {filtered.length
                  ? `Показали ${filtered.length} из ${NATIONAL_PROJECTS.length}.`
                  : "Ничего не нашлось. Сбросьте поиск или выберите другую цель."}{" "}
                {BUDGET_NOTE}
              </p>
              <div className="news-list">
                {filtered.map((project) => {
                  const budget = budgetFor(project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      className={project.id === selected?.id ? "news-card active" : "news-card"}
                      onClick={() => setSelectedId(project.id)}
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
            </article>
          </div>
        </main>

        <aside className="detail keep-on-mobile">
          {selected ? <ProjectCard project={selected} /> : (
            <div className="empty-detail">
              <p>Выберите проект в списке — откроется карточка.</p>
            </div>
          )}
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
    </div>
  );
}

function groupLabel(id: ProjectGroupId) {
  return PROJECT_GROUPS.find((group) => group.id === id)?.title ?? id;
}

function ProjectCard({ project }: { project: NationalProject }) {
  const budget = budgetFor(project.id);
  return (
    <section className="selected-card" id="selected-panel">
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
