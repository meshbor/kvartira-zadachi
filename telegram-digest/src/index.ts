import cron from "node-cron";
import { createBot } from "./bot.ts";
import { config, envStatus } from "./config.ts";
import { collectDigest } from "./digest.ts";
import { sendDigestMessages } from "./send.ts";

const status = envStatus();
console.log("Starting family digest bot", status);

if (status.TELEGRAM_CHAT_ID === "missing") {
  console.log("TELEGRAM_CHAT_ID is missing. Send /start to the bot and add the chat id to .env");
}

const bot = createBot();

if (cron.validate(config.cron)) {
  cron.schedule(
    config.cron,
    async () => {
      try {
        const digest = await collectDigest();
        await sendDigestMessages(digest.messages);
      } catch (error) {
        console.error("Scheduled digest failed", error instanceof Error ? error.message : error);
      }
    },
    { timezone: config.timezone },
  );
  console.log(`Morning digest scheduled: ${config.cron} (${config.timezone})`);
} else {
  console.error("DIGEST_CRON is invalid, scheduler is off");
}

await bot.start({
  onStart: () => {
    console.log("Bot polling started");
  },
});
