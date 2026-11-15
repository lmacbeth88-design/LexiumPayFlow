import assert from "node:assert/strict";
import test from "node:test";
import { hashAuditEvent } from "./ledger.ts";

test("audit hashes are stable across key order and change when event data changes", () => {
  const first = hashAuditEvent({ event: "created", amount: 100 });
  const reordered = hashAuditEvent({ amount: 100, event: "created" });
  const changed = hashAuditEvent({ event: "created", amount: 101 });
  assert.equal(first, reordered);
  assert.notEqual(first, changed);
});
