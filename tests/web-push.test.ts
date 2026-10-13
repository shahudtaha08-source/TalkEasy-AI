import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MOOD_REMINDER_PUSH_TAG,
  buildMoodReminderPushPayload,
  isValidPushEndpoint,
  isValidVapidPublicKey,
  normalizePushSubscription,
} from "../shared/web-push";

test("a valid https subscription is accepted and extras are stripped", () => {
  const result = normalizePushSubscription({
    endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
    keys: { p256dh: "BNc...p256dh", auth: "auth-value" },
    expirationTime: 123,
    extra: "ignored",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result, {
    ok: true,
    value: {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
      p256dh: "BNc...p256dh",
      auth: "auth-value",
    },
  });
});

test("non-https endpoints are rejected except localhost http", () => {
  assert.equal(isValidPushEndpoint("https://push.example.com/x"), true);
  assert.equal(isValidPushEndpoint("http://localhost:5000/x"), true);
  assert.equal(isValidPushEndpoint("http://127.0.0.1/x"), true);
  assert.equal(isValidPushEndpoint("http://evil.example.com/x"), false);
  assert.equal(isValidPushEndpoint("ftp://example.com/x"), false);
  assert.equal(isValidPushEndpoint("javascript:alert(1)"), false);
  assert.equal(isValidPushEndpoint("/relative/path"), false);
  assert.equal(isValidPushEndpoint(""), false);
});

test("subscription validation rejects missing pieces and bounds sizes", () => {
  assert.equal(normalizePushSubscription(null).ok, false);
  assert.equal(normalizePushSubscription("string").ok, false);
  assert.equal(normalizePushSubscription({ keys: { p256dh: "a", auth: "b" } }).ok, false);
  assert.equal(normalizePushSubscription({ endpoint: "not-a-url", keys: { p256dh: "a", auth: "b" } }).ok, false);
  assert.equal(normalizePushSubscription({ endpoint: "https://x.example.com/a", keys: { auth: "b" } }).ok, false);
  assert.equal(normalizePushSubscription({ endpoint: "https://x.example.com/a", keys: { p256dh: "a" } }).ok, false);
  assert.equal(
    normalizePushSubscription({ endpoint: "https://x.example.com/a", keys: { p256dh: "a".repeat(600), auth: "b" } }).ok,
    false,
  );
  assert.equal(
    normalizePushSubscription({ endpoint: `https://x.example.com/${"a".repeat(1100)}`, keys: { p256dh: "a", auth: "b" } }).ok,
    false,
  );
});

test("VAPID public keys must be a 65-byte uncompressed P-256 point", () => {
  const valid = Buffer.concat([Buffer.from([0x04]), Buffer.alloc(64, 7)]).toString("base64url");
  assert.equal(isValidVapidPublicKey(valid), true);
  assert.equal(isValidVapidPublicKey(""), false);
  assert.equal(isValidVapidPublicKey("not-base64-@@"), false);
  // 65 bytes but wrong leading byte.
  const wrongPrefix = Buffer.concat([Buffer.from([0x03]), Buffer.alloc(64, 7)]).toString("base64url");
  assert.equal(isValidVapidPublicKey(wrongPrefix), false);
  // Too short.
  assert.equal(isValidVapidPublicKey(Buffer.alloc(32, 1).toString("base64url")), false);
});

test("mood reminder push payload is neutral and deep-links to the check-in", () => {
  const payload = buildMoodReminderPushPayload();
  assert.equal(payload.tag, MOOD_REMINDER_PUSH_TAG);
  assert.equal(payload.deepLink, "/mood-enhanced");
  assert.equal(payload.body, "Time for your TalkEasy mood check-in.");
  assert.equal(/\d/.test(payload.body), false, "payload must not leak any readings");
});
