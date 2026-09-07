import { Bot } from "grammy";
import { assertToken, config, isAllowedChat } from "./config.ts";
import { collectDigest } from "./digest.ts";
import { loadSources } from "./sources/load-sources.ts";

export function createBot(): Bot {
  const bot = new Bot(assertToken());

  bot.command("start", async (ctx) => {
    const chatId = ctx.chat?.id;
    const lines = [
      "Утренний дайджест по многодетным, выплатам и льготам для семей.",
      "",
      `Ваш chat id: <code>${chatId ?? "unknown"}</code>`,
    ];

    if (!config.chatId) {
      lines.push(
        "",
        "Положите этот id в <code>TELEGRAM_CHAT_ID</code> в локальный <code>.env</code> — тогда бот будет писать только вам.",
      );
    } else if (!isAllowedChat(chatId)) {
      lines.push("", "Это личный бот, рассылка включена для другого чата.");
    } else {
      lines.push(
        "",
        "Команды:",
        "/digest — собрать новости сейчас",
        "/sources — список источников",
      );
    }

    await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "/start — chat id и статус",
        "/digest — собрать дайджест сейчас",
        "/sources — RSS и публичные каналы",
      ].join("\n"),
    );
  });

  bot.command("sources", async (ctx) => {
    if (!isAllowedChat(ctx.chat?.id)) {
      await ctx.reply("Это личный бот.");
      return;
    }

    const sources = await loadSources();
    const rss = sources.rss.map((source) => `• RSS: ${source.name}`).join("\n");
    const html = sources.html.map((source) => `• Сайт: ${source.name}`).join("\n");
    const telegram = sources.telegram.length
      ? sources.telegram.map((source) => `• Telegram: ${source.name} (@${source.username})`).join("\n")
      : "• Telegram-каналы не заданы — добавьте username в data/sources.json";

    await ctx.reply(["Источники:", rss, html, telegram].filter(Boolean).join("\n"));
  });

  bot.command("digest", async (ctx) => {
    if (!isAllowedChat(ctx.chat?.id)) {
      await ctx.reply("Это личный бот. Сначала пропишите TELEGRAM_CHAT_ID после /start.");
      return;
    }

    await ctx.reply("Собираю…");
    const digest = await collectDigest();
    for (const message of digest.messages) {
      await ctx.reply(message, { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
    }
  });

  return bot;
}
