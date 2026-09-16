import { createHash, timingSafeEqual } from "node:crypto";

export const OPERATOR_COOKIE = "pulekov-window";
export const DEFAULT_OPERATOR_PASSWORD = "arewegoingtofermaagain";

export function operatorPassword(): string {
  return process.env.OPERATOR_PASSWORD || DEFAULT_OPERATOR_PASSWORD;
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function safeEqual(left: string, right: string): boolean {
  const a = sha256(left);
  const b = sha256(right);
  return timingSafeEqual(a, b);
}

export function operatorCookieValue(): string {
  return sha256(`operator:${operatorPassword()}`).toString("hex");
}

export function isOperatorCookie(value: string | undefined): boolean {
  if (!value) return false;
  return safeEqual(value, operatorCookieValue());
}

export function isOperatorPassword(input: string): boolean {
  return safeEqual(input.trim(), operatorPassword());
}
