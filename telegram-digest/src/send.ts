import { Bot } from "grammy";
import { assertChatId, assertToken } from "./config.ts";

export async function sendDigestMessages(messages: string[]): Promise<void> {
  const bot = new Bot(assertToken());
  const chatId = assertChatId();

  for (const message of messages) {
    await bot.api.sendMessage(chatId, message, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  }
}
