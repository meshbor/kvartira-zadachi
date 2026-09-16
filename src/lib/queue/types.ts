export type TicketStatus = "waiting" | "serving" | "done";

export type Ticket = {
  code: string;
  number: number;
  name: string;
  issuedAt: string;
  status: TicketStatus;
  calledAt: string | null;
  doneAt: string | null;
};

export type QueueState = {
  day: string;
  nextNumber: number;
  tickets: Ticket[];
};

export type QueueView = {
  day: string;
  nowServing: Ticket | null;
  waiting: Ticket[];
  done: Ticket[];
  lastIssued: Ticket | null;
  waitingCount: number;
  doneCount: number;
  issuedCount: number;
  resetsAt: string;
  minutesPerVisitor: number;
};

export type TicketLookup = {
  ticket: Ticket;
  peopleAhead: number;
  nowServing: Ticket | null;
  etaMinutes: number;
};
