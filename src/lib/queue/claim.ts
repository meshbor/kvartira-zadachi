import { secondsUntilReset } from "./time";

export const CLAIM_COOKIE = "alexey-p-claim";

export type TicketClaim = { day: string; code: string };

export function serializeClaim(claim: TicketClaim): string {
  return `${claim.day}:${claim.code}`;
}

export function parseClaim(value: string | undefined): TicketClaim | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2}):(АП-\d{3})$/);
  if (!match) return null;
  return { day: match[1], code: match[2] };
}

export function claimCookieOptions(now = new Date()) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(60, secondsUntilReset(now)),
  };
}
