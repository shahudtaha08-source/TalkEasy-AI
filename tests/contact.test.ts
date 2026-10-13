import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_TEXT,
  SUPPORT_MAILTO,
  FEEDBACK_MAILTO,
  REVIEW_MAILTO,
  buildMailto,
} from "../client/src/lib/contact";

test("the official support email is talkeasysupport@gmail.com", () => {
  assert.equal(SUPPORT_EMAIL, "talkeasysupport@gmail.com");
  assert.equal(SUPPORT_EMAIL_TEXT, SUPPORT_EMAIL);
});

test("the support address is not a retired talkeasy.ai mailbox", () => {
  for (const addr of [SUPPORT_EMAIL, SUPPORT_EMAIL_TEXT]) {
    assert.equal(addr.includes("talkeasy.ai"), false);
  }
});

test("support mailto link targets the support address with no subject", () => {
  assert.equal(SUPPORT_MAILTO, "mailto:talkeasysupport@gmail.com");
  assert.equal(buildMailto(), "mailto:talkeasysupport@gmail.com");
});

test("subjects and bodies are percent-encoded with %20 for spaces (not +)", () => {
  const url = buildMailto({ subject: "TalkEasy Feedback", body: "Line one\nLine two" });
  assert.ok(url.startsWith("mailto:talkeasysupport@gmail.com?"));
  assert.ok(url.includes("subject=TalkEasy%20Feedback"));
  assert.equal(url.includes("+"), false, "spaces must not be encoded as +");
  assert.ok(url.includes("body=Line%20one%0ALine%20two"));
});

test("feedback and review links carry recognisable prefilled subjects", () => {
  assert.equal(FEEDBACK_MAILTO, "mailto:talkeasysupport@gmail.com?subject=TalkEasy%20Feedback");
  assert.equal(REVIEW_MAILTO, "mailto:talkeasysupport@gmail.com?subject=TalkEasy%20Review");
});
