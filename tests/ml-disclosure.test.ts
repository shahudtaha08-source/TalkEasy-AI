import { test } from "node:test";
import assert from "node:assert/strict";
import { ML_LIMITATIONS, buildMlDisclosure, withDisclosure } from "../shared/ml-types";

test("the ML disclosure is explicitly experimental and an estimate", () => {
  const disclosure = buildMlDisclosure();
  assert.equal(disclosure.experimental, true);
  assert.equal(disclosure.estimate, true);
});

test("the disclosure lists limitations and calls out the non-diagnosis stance", () => {
  const disclosure = buildMlDisclosure();
  assert.ok(disclosure.limitations.length >= 3);
  assert.ok(disclosure.limitations.some((line) => /not a diagnosis/i.test(line)));
  assert.ok(disclosure.limitations.some((line) => /never made/i.test(line)));
  assert.deepEqual(disclosure.limitations, ML_LIMITATIONS);
});

test("withDisclosure attaches the disclosure to ok, insufficient and error envelopes", () => {
  const ok = withDisclosure({ status: "ok" as const, data: { hello: "world" } });
  assert.equal(ok.disclosure?.experimental, true);
  assert.deepEqual(ok.data, { hello: "world" });

  const insufficient = withDisclosure({ status: "insufficient" as const, message: "Not enough data" });
  assert.equal(insufficient.disclosure?.estimate, true);

  const error = withDisclosure({ status: "error" as const, message: "boom" });
  assert.ok(error.disclosure);
  assert.equal(error.status, "error");
});

test("buildMlDisclosure returns a fresh array so callers cannot mutate the shared default", () => {
  const a = buildMlDisclosure();
  a.limitations.push("mutated");
  const b = buildMlDisclosure();
  assert.equal(b.limitations.includes("mutated"), false);
  assert.equal(b.limitations.length, ML_LIMITATIONS.length);
});
