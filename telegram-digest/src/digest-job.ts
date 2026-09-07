import { collectDigest } from "./digest.ts";
import { envStatus } from "./config.ts";
import { sendDigestMessages } from "./send.ts";

const dryRun = process.argv.includes("--dry-run");

const digest = await collectDigest();

if (dryRun) {
  console.log("Digest dry-run (nothing sent)");
  console.log(
    `Fetched: ${digest.fetched}; matched: ${digest.items.length}; source errors: ${digest.errors.length}`,
  );
  for (const message of digest.messages) {
    console.log("---");
    console.log(message);
  }
  process.exit(0);
}

const status = envStatus();
if (status.TELEGRAM_BOT_TOKEN === "missing" || status.TELEGRAM_CHAT_ID === "missing") {
  console.error("Refusing to send: env is incomplete", status);
  process.exit(1);
}

await sendDigestMessages(digest.messages);
console.log(`Sent ${digest.messages.length} message(s), ${digest.items.length} item(s)`);
