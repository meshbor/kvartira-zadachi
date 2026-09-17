import assert from "node:assert/strict";
import { test } from "node:test";
import { parseClaim, serializeClaim } from "./claim";

test("serializes and parses a same-day ticket claim", () => {
  const claim = { day: "2026-09-17", code: "АП-003" };
  assert.deepEqual(parseClaim(serializeClaim(claim)), claim);
  assert.equal(parseClaim("АП-003"), null);
  assert.equal(parseClaim("2026-09-17:АП-3"), null);
});
