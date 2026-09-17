import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { callNext, emptyState, ensureDay, issueTicket, lookupTicket, toView } from "./logic";
import { moscowDay, nextMoscowMidnight, secondsUntilReset } from "./time";
import type { QueueState, QueueView, Ticket, TicketLookup } from "./types";

const STATE_KEY = "alexey-p-queue";
const FILE_PATH = path.join("/tmp", "alexey-p-queue.json");

type GlobalStore = {
  chain: Promise<unknown>;
  memory: QueueState | null;
};

const globalStore = globalThis as typeof globalThis & {
  __alexeyQueue?: GlobalStore;
};

function slot(): GlobalStore {
  if (!globalStore.__alexeyQueue) {
    globalStore.__alexeyQueue = { chain: Promise.resolve(), memory: null };
  }
  return globalStore.__alexeyQueue;
}

function hasRedis(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisCommand(command: Array<string | number>): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis is not configured");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Redis error ${response.status}`);
  }
  const payload = (await response.json()) as { result: unknown };
  return payload.result;
}

async function readFileState(): Promise<QueueState | null> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    return JSON.parse(raw) as QueueState;
  } catch {
    return null;
  }
}

async function writeFileState(state: QueueState): Promise<void> {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(state), "utf8");
}

async function loadState(now: Date): Promise<QueueState> {
  const day = moscowDay(now);
  if (hasRedis()) {
    const raw = await redisCommand(["GET", STATE_KEY]);
    if (typeof raw === "string" && raw) {
      return ensureDay(JSON.parse(raw) as QueueState, day);
    }
    return emptyState(day);
  }
  const cached = slot().memory ?? (await readFileState());
  if (!cached) return emptyState(day);
  return ensureDay(cached, day);
}

async function saveState(state: QueueState, now: Date): Promise<void> {
  slot().memory = state;
  if (hasRedis()) {
    const ttl = Math.max(60, secondsUntilReset(now) + 3600);
    await redisCommand(["SET", STATE_KEY, JSON.stringify(state), "EX", ttl]);
    return;
  }
  await writeFileState(state);
}

async function mutate<T>(now: Date, fn: (state: QueueState) => T | Promise<T>): Promise<T> {
  const box = slot();
  const run = box.chain.then(async () => {
    if (hasRedis()) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const locked = await redisCommand(["SET", `${STATE_KEY}:lock`, "1", "NX", "EX", 6]);
        if (locked === "OK") {
          try {
            const state = await loadState(now);
            const result = await fn(state);
            return result;
          } finally {
            await redisCommand(["DEL", `${STATE_KEY}:lock`]);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 40 + attempt * 20));
      }
    }
    const state = await loadState(now);
    return fn(state);
  });
  box.chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function getQueueView(now = new Date()): Promise<QueueView> {
  return mutate(now, async (state) => {
    const next = ensureDay(state, moscowDay(now));
    await saveState(next, now);
    return toView(next, now);
  });
}

export async function takeTicket(name: string, now = new Date()): Promise<{ view: QueueView; ticket: Ticket }> {
  return mutate(now, async (state) => {
    const issued = issueTicket(state, { day: moscowDay(now), name, now });
    await saveState(issued.state, now);
    return { view: toView(issued.state, now), ticket: issued.ticket };
  });
}

export async function findTicket(code: string, now = new Date()): Promise<{ view: QueueView; lookup: TicketLookup | null }> {
  return mutate(now, async (state) => {
    const next = ensureDay(state, moscowDay(now));
    await saveState(next, now);
    return { view: toView(next, now), lookup: lookupTicket(next, code) };
  });
}

export async function inviteNextVisitor(now = new Date()): Promise<QueueView> {
  return mutate(now, async (state) => {
    const next = callNext(state, moscowDay(now), now);
    await saveState(next, now);
    return toView(next, now);
  });
}

export async function resetQueue(now = new Date()): Promise<QueueView> {
  return mutate(now, async () => {
    const next = emptyState(moscowDay(now));
    await saveState(next, now);
    if (hasRedis()) {
      await redisCommand(["DEL", STATE_KEY]);
      await saveState(next, now);
    }
    return toView(next, now);
  });
}

export function queueResetsAt(now = new Date()): string {
  return nextMoscowMidnight(now).toISOString();
}
