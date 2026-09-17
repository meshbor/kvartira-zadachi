import type { QueueState, QueueView, Ticket, TicketLookup } from "./types";
import { nextMoscowMidnight } from "./time";

export const MAX_TICKETS_PER_DAY = 999;
export const TICKET_PREFIX = "АП";

export function formatTicketCode(number: number): string {
  return `${TICKET_PREFIX}-${String(number).padStart(3, "0")}`;
}

export function parseTicketCode(value: string): string | null {
  const match = value.trim().toUpperCase().replaceAll(" ", "").match(/^(?:АП-?)?(\d{1,4})$/);
  if (!match) return null;
  return formatTicketCode(Number(match[1]));
}

export function sanitizeName(value: string): string {
  return value.replace(/[\u0000-\u001F<>]/g, "").trim().slice(0, 32);
}

export function emptyState(day: string): QueueState {
  return { day, nextNumber: 1, tickets: [] };
}

export function ensureDay(state: QueueState, day: string): QueueState {
  return state.day === day ? state : emptyState(day);
}

function withTickets(state: QueueState, tickets: Ticket[]): QueueState {
  return { ...state, tickets };
}

function completeServing(state: QueueState, now: Date): QueueState {
  return withTickets(
    state,
    state.tickets.map((ticket) =>
      ticket.status === "serving"
        ? { ...ticket, status: "done", doneAt: now.toISOString() }
        : ticket,
    ),
  );
}

function inviteNext(state: QueueState, now: Date): QueueState {
  const next = state.tickets.find((ticket) => ticket.status === "waiting");
  if (!next) return state;
  return withTickets(
    state,
    state.tickets.map((ticket) =>
      ticket.code === next.code
        ? { ...ticket, status: "serving", calledAt: now.toISOString() }
        : ticket,
    ),
  );
}

export function issueTicket(
  state: QueueState,
  input: { day: string; name: string; now: Date },
): { state: QueueState; ticket: Ticket } {
  const next = ensureDay(state, input.day);
  if (next.nextNumber > MAX_TICKETS_PER_DAY) {
    throw new Error("На сегодня талоны закончились. Приходите после 00:00 МСК.");
  }

  const ticket: Ticket = {
    code: formatTicketCode(next.nextNumber),
    number: next.nextNumber,
    name: sanitizeName(input.name),
    issuedAt: input.now.toISOString(),
    status: "waiting",
    calledAt: null,
    doneAt: null,
  };

  return {
    state: {
      ...next,
      nextNumber: next.nextNumber + 1,
      tickets: [...next.tickets, ticket],
    },
    ticket,
  };
}

export function callNext(state: QueueState, day: string, now: Date): QueueState {
  let next = ensureDay(state, day);
  if (next.tickets.some((ticket) => ticket.status === "serving")) {
    next = completeServing(next, now);
  }
  return inviteNext(next, now);
}

export function toView(state: QueueState, now = new Date()): QueueView {
  const waiting = state.tickets.filter((ticket) => ticket.status === "waiting");
  const done = state.tickets.filter((ticket) => ticket.status === "done");
  const nowServing = state.tickets.find((ticket) => ticket.status === "serving") ?? null;
  const lastIssued = state.tickets.at(-1) ?? null;
  return {
    day: state.day,
    nowServing,
    waiting,
    done,
    lastIssued,
    waitingCount: waiting.length,
    doneCount: done.length,
    issuedCount: state.tickets.length,
    resetsAt: nextMoscowMidnight(now).toISOString(),
  };
}

export function lookupTicket(state: QueueState, code: string): TicketLookup | null {
  const normalized = parseTicketCode(code);
  if (!normalized) return null;
  const ticket = state.tickets.find((item) => item.code === normalized);
  if (!ticket) return null;
  const peopleAhead =
    ticket.status === "waiting"
      ? state.tickets.filter(
          (item) => item.status === "waiting" && item.number < ticket.number,
        ).length + (state.tickets.some((item) => item.status === "serving") ? 1 : 0)
      : 0;
  return {
    ticket,
    peopleAhead,
    nowServing: state.tickets.find((item) => item.status === "serving") ?? null,
  };
}
