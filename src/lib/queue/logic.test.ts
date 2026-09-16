import assert from "node:assert/strict";
import { test } from "node:test";
import {
  autoAdvance,
  callNext,
  emptyState,
  formatTicketCode,
  issueTicket,
  lookupTicket,
  parseTicketCode,
  sanitizeName,
} from "./logic";
import { moscowDay, nextMoscowMidnight } from "./time";

test("formats Sber-style ticket codes", () => {
  assert.equal(formatTicketCode(1), "АП-001");
  assert.equal(formatTicketCode(42), "АП-042");
  assert.equal(parseTicketCode("ап 7"), "АП-007");
  assert.equal(parseTicketCode("АП-015"), "АП-015");
  assert.equal(parseTicketCode("nope"), null);
});

test("issues the first ticket and invites it to the window", () => {
  const now = new Date("2026-09-16T10:00:00+03:00");
  const { state, ticket } = issueTicket(emptyState("2026-09-16"), {
    day: "2026-09-16",
    name: "Ира",
    now,
  });
  assert.equal(ticket.code, "АП-001");
  assert.equal(ticket.status, "serving");
  assert.equal(state.tickets[0]?.status, "serving");
  const second = issueTicket(state, { day: "2026-09-16", name: "Олег", now });
  assert.equal(second.ticket.code, "АП-002");
  assert.equal(second.ticket.status, "waiting");
  const lookup = lookupTicket(second.state, "АП-002");
  assert.equal(lookup?.peopleAhead, 1);
  assert.equal(lookup?.etaMinutes, 6);
});

test("auto-advances the window after six minutes", () => {
  const start = new Date("2026-09-16T10:00:00+03:00");
  let { state } = issueTicket(emptyState("2026-09-16"), {
    day: "2026-09-16",
    name: "А",
    now: start,
  });
  state = issueTicket(state, {
    day: "2026-09-16",
    name: "Б",
    now: start,
  }).state;
  const later = new Date(start.getTime() + 6 * 60 * 1000);
  const advanced = autoAdvance(state, later);
  assert.equal(advanced.tickets[0]?.status, "done");
  assert.equal(advanced.tickets[1]?.status, "serving");
});

test("resets on a new Moscow day", () => {
  const monday = new Date("2026-09-16T10:00:00+03:00");
  const { state } = issueTicket(emptyState("2026-09-16"), {
    day: "2026-09-16",
    name: "А",
    now: monday,
  });
  const tuesday = new Date("2026-09-17T00:05:00+03:00");
  const next = issueTicket(state, {
    day: moscowDay(tuesday),
    name: "Б",
    now: tuesday,
  });
  assert.equal(next.ticket.code, "АП-001");
  assert.equal(next.state.tickets.length, 1);
});

test("operator can skip to the next visitor", () => {
  const now = new Date("2026-09-16T10:00:00+03:00");
  let { state } = issueTicket(emptyState("2026-09-16"), {
    day: "2026-09-16",
    name: "А",
    now,
  });
  state = issueTicket(state, { day: "2026-09-16", name: "Б", now }).state;
  state = callNext(state, "2026-09-16", now);
  assert.equal(state.tickets[0]?.status, "done");
  assert.equal(state.tickets[1]?.status, "serving");
});

test("next Moscow midnight is 00:00 MSK", () => {
  const now = new Date("2026-09-16T13:15:00+03:00");
  assert.equal(moscowDay(now), "2026-09-16");
  assert.equal(nextMoscowMidnight(now).toISOString(), "2026-09-16T21:00:00.000Z");
});

test("sanitizes visitor names", () => {
  assert.equal(sanitizeName("  <Ира>\n"), "Ира");
  assert.equal(sanitizeName("я".repeat(50)).length, 32);
});
