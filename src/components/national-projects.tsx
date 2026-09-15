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

export function NationalProjectsApp() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<ProjectGroupId | "all">("all");
  const [selectedId, setSelectedId] = useState(NATIONAL_PROJECTS[0].id);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return NATIONAL_PROJECTS.filter((project) => {
      if (group !== "all" && project.group !== group) return false;
      if (!needle) return true;
      const haystack = [
        project.title,
        project.goal,
        project.agency,
        ...project.federalProjects,
        ...project.highlights,
        ...project.itHooks,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [group, query]);

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
            <div className="chip-list">
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
                  : "Ничего не нашлось. Сбросьте поиск или выберите другую цель."}
              </p>
              <div className="news-list">
                {filtered.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={project.id === selected?.id ? "news-card active" : "news-card"}
                    onClick={() => setSelectedId(project.id)}
                  >
                    <div className="news-meta">
                      <span className="fresh">{groupLabel(project.group)}</span>
                      <span>{project.agency}</span>
                    </div>
                    <strong>{project.title}</strong>
                    <p>{project.goal}</p>
                  </button>
                ))}
              </div>
            </article>
          </div>
        </main>

        <aside className="detail keep-on-mobile">
          {selected ? <ProjectCard project={selected} /> : (
            <div className="empty-detail">
              <p>Выберите проект слева — справа откроется карточка.</p>
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
  return (
    <section className="selected-card">
      <p className="bubble-kicker">{groupLabel(project.group)}</p>
      <h2>{project.title}</h2>
      <p className="why">{project.goal}</p>
      <dl>
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
