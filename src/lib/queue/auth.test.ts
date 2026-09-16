import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_OPERATOR_PASSWORD,
  isOperatorCookie,
  isOperatorPassword,
  operatorCookieValue,
} from "./auth";

test("accepts the operator password", () => {
  assert.equal(isOperatorPassword(DEFAULT_OPERATOR_PASSWORD), true);
  assert.equal(isOperatorPassword("wrong"), false);
  assert.equal(isOperatorPassword(" pulekov "), true);
});

test("cookie is only valid for the current password", () => {
  const cookie = operatorCookieValue();
  assert.equal(isOperatorCookie(cookie), true);
  assert.equal(isOperatorCookie("nope"), false);
  assert.equal(isOperatorCookie(undefined), false);
});
