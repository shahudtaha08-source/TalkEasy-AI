import { test } from "node:test";
import assert from "node:assert/strict";
import { userPreferencesQueryKey } from "../client/src/hooks/use-user-preferences";

// ─── Query key isolation ─────────────────────────────────────────────────────

test("query key includes user ID", () => {
  const key = userPreferencesQueryKey("user-123");
  assert.deepEqual(key, ["/api/user-preferences", "user-123"]);
});

test("query key for null user includes null", () => {
  const key = userPreferencesQueryKey(null);
  assert.deepEqual(key, ["/api/user-preferences", null]);
});

test("query key for undefined user includes null", () => {
  const key = userPreferencesQueryKey(undefined);
  assert.deepEqual(key, ["/api/user-preferences", null]);
});

test("Account A and Account B have different query keys", () => {
  const keyA = userPreferencesQueryKey("user-A");
  const keyB = userPreferencesQueryKey("user-B");
  assert.notDeepEqual(keyA, keyB);
});

test("same user produces same query key (cache hit)", () => {
  const key1 = userPreferencesQueryKey("user-123");
  const key2 = userPreferencesQueryKey("user-123");
  assert.deepEqual(key1, key2);
});

test("query key always starts with /api/user-preferences", () => {
  const key = userPreferencesQueryKey("any-user");
  assert.equal(key[0], "/api/user-preferences");
});

test("empty string userId produces distinct key from null", () => {
  const keyEmpty = userPreferencesQueryKey("");
  const keyNull = userPreferencesQueryKey(null);
  // Empty string is falsy but still a distinct value
  assert.notDeepEqual(keyEmpty, keyNull);
});

// ─── Cache isolation verification ─────────────────────────────────────────────

test("query keys for different users are never equal", () => {
  const users = ["alice", "bob", "charlie", "dave"];
  const keys = users.map((u) => JSON.stringify(userPreferencesQueryKey(u)));
  const unique = new Set(keys);
  assert.equal(unique.size, users.length, "All query keys must be unique per user");
});

test("null/undefined users produce same key (unauthenticated)", () => {
  const keyNull = userPreferencesQueryKey(null);
  const keyUndef = userPreferencesQueryKey(undefined);
  assert.deepEqual(keyNull, keyUndef);
});