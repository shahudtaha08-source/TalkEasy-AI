import { test } from "node:test";
import assert from "node:assert/strict";
import {
  maskEmail,
  resolveEmailProvider,
  getEmailConfigStatus,
  getSupportEmail,
  buildPasswordResetUrl,
  buildPasswordResetEmail,
  sendEmail,
  EmailConfigurationError,
  EmailDeliveryError,
} from "../server/email";

const EMAIL_KEYS = [
  "NODE_ENV",
  "EMAIL_PROVIDER",
  "RESEND_API_KEY",
  "SENDGRID_API_KEY",
  "MAILGUN_API_KEY",
  "MAILGUN_DOMAIN",
  "SMTP_HOST",
  "SMTP_PORT",
  "EMAIL_FROM",
  "SUPPORT_EMAIL",
  "APP_PUBLIC_URL",
  "PUBLIC_APP_URL",
  "APP_URL",
  "VITE_APP_URL",
];

function withEnv(vars: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const saved: Record<string, string | undefined> = {};
  for (const k of EMAIL_KEYS) saved[k] = process.env[k];
  for (const k of EMAIL_KEYS) delete process.env[k];
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const k of EMAIL_KEYS) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    });
}

test("maskEmail never reveals the local part", () => {
  assert.equal(maskEmail("jane@example.com"), "j***@example.com");
  assert.equal(maskEmail("not-an-email"), "***");
});

test("provider inference: explicit wins, otherwise credentials, otherwise console/free", async () => {
  await withEnv({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "x" }, () => {
    assert.equal(resolveEmailProvider(), "resend");
  });
  await withEnv({ RESEND_API_KEY: "x" }, () => {
    assert.equal(resolveEmailProvider(), "resend");
  });
  await withEnv({ NODE_ENV: "development" }, () => {
    assert.equal(resolveEmailProvider(), "console");
  });
  await withEnv({ NODE_ENV: "production" }, () => {
    assert.equal(resolveEmailProvider(), "none");
  });
});

test("unconfigured provider reports configured:false with a reason and blocks sending", async () => {
  await withEnv({ NODE_ENV: "production", EMAIL_PROVIDER: "none" }, async () => {
    const status = getEmailConfigStatus();
    assert.equal(status.configured, false);
    assert.ok(status.reason);
    await assert.rejects(
      () => sendEmail({ to: "a@b.com", subject: "hi", text: "x" }),
      (e: unknown) => e instanceof EmailConfigurationError,
    );
  });
});

test("console provider is refused in production", async () => {
  await withEnv({ NODE_ENV: "production", EMAIL_PROVIDER: "console" }, async () => {
    assert.equal(getEmailConfigStatus().configured, false);
    await assert.rejects(
      () => sendEmail({ to: "a@b.com", subject: "hi", text: "x" }),
      (e: unknown) => e instanceof EmailConfigurationError,
    );
  });
});

test("console provider in development succeeds and never logs the body", async () => {
  await withEnv({ NODE_ENV: "development", EMAIL_PROVIDER: "console" }, async () => {
    const secret = "SUPER_SECRET_RESET_TOKEN";
    const logs: string[] = [];
    const orig = console.log;
    (console as any).log = (...a: unknown[]) => logs.push(a.join(" "));
    try {
      const result = await sendEmail({ to: "jane@example.com", subject: "Reset", text: `token=${secret}` });
      assert.equal(result.delivered, true);
      assert.equal(result.provider, "console");
    } finally {
      (console as any).log = orig;
    }
    const joined = logs.join("\n");
    assert.ok(joined.includes("j***@example.com"));
    assert.equal(joined.includes(secret), false, "the email body/token must never be logged");
  });
});

test("reset URL is built only from trusted config and encodes the token", async () => {
  await withEnv({}, () => {
    assert.throws(() => buildPasswordResetUrl("abc"), (e: unknown) => e instanceof EmailConfigurationError);
  });
  await withEnv({ APP_PUBLIC_URL: "https://app.talkeasy.example/" }, () => {
    assert.equal(
      buildPasswordResetUrl("a b/c"),
      "https://app.talkeasy.example/reset-password?token=a%20b%2Fc",
    );
  });
});

test("reset email contains the link and single-use wording", async () => {
  await withEnv({ APP_PUBLIC_URL: "https://app.talkeasy.example" }, () => {
    const msg = buildPasswordResetEmail("tok_123", 60);
    assert.equal(msg.subject, "Reset your TalkEasy password");
    assert.ok(msg.text.includes("token=tok_123"));
    assert.match(msg.text, /expires in 60 minutes/);
    assert.match(msg.text, /safely ignore/);
  });
});

test("the public support address defaults to the official mailbox and is overridable", async () => {
  assert.equal(getSupportEmail(), "talkeasysupport@gmail.com");
  await withEnv({ SUPPORT_EMAIL: "help@example.org" }, () => {
    assert.equal(getSupportEmail(), "help@example.org");
  });
});

test("the support contact is separate from the SMTP sender", async () => {
  await withEnv({ EMAIL_FROM: "no-reply@your-domain.example" }, () => {
    assert.notEqual(getSupportEmail(), process.env.EMAIL_FROM);
  });
});

test("the reset email points users at the public support contact", async () => {
  await withEnv({ APP_PUBLIC_URL: "https://app.talkeasy.example" }, () => {
    const msg = buildPasswordResetEmail("tok", 30);
    assert.ok(msg.text.includes(getSupportEmail()));
    assert.ok(msg.html!.includes(getSupportEmail()));
  });
});

test("a real provider reports delivery success via its HTTP API", async () => {
  await withEnv(
    { NODE_ENV: "production", EMAIL_PROVIDER: "resend", RESEND_API_KEY: "key", EMAIL_FROM: "noreply@talkeasy.example" },
    async () => {
      const original = globalThis.fetch;
      (globalThis as any).fetch = async () =>
        new Response(JSON.stringify({ id: "resend-id-1" }), { status: 200 });
      try {
        const result = await sendEmail({ to: "jane@example.com", subject: "Reset", text: "hi" });
        assert.equal(result.delivered, true);
        assert.equal(result.provider, "resend");
        assert.equal(result.id, "resend-id-1");
      } finally {
        (globalThis as any).fetch = original;
      }
    },
  );
});

test("a provider rejection surfaces EmailDeliveryError and does not fake success", async () => {
  await withEnv(
    { NODE_ENV: "production", EMAIL_PROVIDER: "resend", RESEND_API_KEY: "key", EMAIL_FROM: "noreply@talkeasy.example" },
    async () => {
      const original = globalThis.fetch;
      (globalThis as any).fetch = async () => new Response("bad key", { status: 401 });
      try {
        await assert.rejects(
          () => sendEmail({ to: "jane@example.com", subject: "Reset", text: "hi" }),
          (e: unknown) => e instanceof EmailDeliveryError,
        );
      } finally {
        (globalThis as any).fetch = original;
      }
    },
  );
});
