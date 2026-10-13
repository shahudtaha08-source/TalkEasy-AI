#!/usr/bin/env node
/**
 * TalkEasy v6.3.0 — generate a fresh VAPID key pair for Web Push.
 *
 * The output is a SECRET. Do not commit it, paste it into source, or log it in
 * CI. Copy the two values into your deployment secrets as:
 *
 *   VAPID_PUBLIC_KEY   (also exposed to the browser)
 *   VAPID_PRIVATE_KEY  (server-only, never sent to clients)
 *   VAPID_SUBJECT      (optional, e.g. mailto:talkeasysupport@gmail.com)
 *
 * Run:  node scripts/generate-vapid-keys.mjs
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
process.stdout.write(`VAPID_PUBLIC_KEY=${keys.publicKey}\n`);
process.stdout.write(`VAPID_PRIVATE_KEY=${keys.privateKey}\n`);
process.stdout.write(`VAPID_SUBJECT=mailto:talkeasysupport@gmail.com\n`);
