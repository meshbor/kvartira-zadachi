import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

loadEnv({ path: resolve(packageRoot, ".env") });

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "replace-me") {
    return undefined;
  }

  return trimmed;
}

export const packageRootDir = packageRoot;

export const config = {
  token: readEnv("TELEGRAM_BOT_TOKEN"),
  chatId: readEnv("TELEGRAM_CHAT_ID"),
  timezone: readEnv("DIGEST_TIMEZONE") ?? "Europe/Moscow",
  cron: readEnv("DIGEST_CRON") ?? "30 7 * * *",
  lookbackHours: Number(readEnv("DIGEST_LOOKBACK_HOURS") ?? "24"),
  extraKeywords: (readEnv("DIGEST_EXTRA_KEYWORDS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
};

export function assertToken(): string {
  if (!config.token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not set. Copy telegram-digest/.env.example to .env and paste the token from @BotFather.",
    );
  }

  return config.token;
}

export function assertChatId(): string {
  if (!config.chatId) {
    throw new Error(
      "TELEGRAM_CHAT_ID is not set. Send /start to the bot and put the printed chat id into .env.",
    );
  }

  return config.chatId;
}

export function isAllowedChat(chatId: number | string | undefined): boolean {
  if (chatId == null || !config.chatId) {
    return false;
  }

  return String(chatId) === config.chatId;
}

export function envStatus(): Record<string, "set" | "missing"> {
  return {
    TELEGRAM_BOT_TOKEN: config.token ? "set" : "missing",
    TELEGRAM_CHAT_ID: config.chatId ? "set" : "missing",
  };
}
