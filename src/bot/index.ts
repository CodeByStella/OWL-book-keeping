import config from "@/config";
import { Context, Markup, Telegraf } from "telegraf";
import groupHandler from "./handlers/groupHandler";
import bookkeepingHandler from "./handlers/bookkeepingHandler";
import { Message } from "telegraf/typings/core/types/typegram";
import GroupSession from "@/models/GroupSession";

const bot = new Telegraf(config.BOT_TOKEN);

bot.use(groupHandler);
bot.use(bookkeepingHandler);

bot.telegram.setMyCommands([
  { command: "start", description: "Start the bot / 启动机器人" },
  { command: "broadcast", description: "Broadcast a message to groups / 群发消息" },
]);

bot.start((ctx: Context) => {
  // Only allow in private chats
  if (ctx.chat?.type !== "private") return;

  try {
    const userLang = (ctx.from?.language_code || "en").split("-")[0];
    const replyText = userLang === "zh"
      ? "👋 *欢迎使用 OwlBookKeepingBot！*\n\n请将我添加到您的群组，我将帮助您轻松管理群组的记账任务。"
      : "👋 *Welcome to OwlBookKeepingBot!*\n\nTo get started, please add me to your group. I’ll help you manage your group’s bookkeeping tasks easily.";
    ctx.reply(replyText, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in /start handler:", error);
  }
});

// Store broadcast state per user
const broadcastState: Record<number, { lang: "zh" | "en" | null }> = {};

// Helper to get group IDs by language
async function getGroupIdsByLang(language: "zh" | "en"): Promise<number[]> {
  try {
    const groups = await GroupSession.find({ language });
    return groups.map((g: any) => g.groupId);
  } catch (e) {
    console.error("Error fetching group ids:", e);
    return [];
  }
}

bot.command("broadcast", async (ctx) => {
  // Only allow in private chats
  if (ctx.chat?.type !== "private") return;

  const userLang = (ctx.from?.language_code || "en").split("-")[0];
  const replyText =
    userLang === "zh"
      ? "请选择要广播的群组语言："
      : "Please select the group language to broadcast to:";
  await ctx.reply(
    replyText,
    Markup.inlineKeyboard([
      [Markup.button.callback("🇨🇳 Chinese Groups", "broadcast_zh")],
      [Markup.button.callback("🇬🇧 English Groups", "broadcast_en")],
    ]),
  );
  broadcastState[ctx.from.id] = { lang: null };
});

bot.action("broadcast_zh", async (ctx) => {
  // Only allow in private chats
  if (ctx.chat?.type !== "private") return;

  broadcastState[ctx.from.id] = { lang: "zh" };
  await ctx.answerCbQuery();
  const userLang = (ctx.from?.language_code || "en").split("-")[0];
  await ctx.reply(
    userLang === "zh"
      ? "请发送您要广播到中文群组的消息。"
      : "Please send the message you want to broadcast to Chinese groups.",
  );
});

bot.action("broadcast_en", async (ctx) => {
  // Only allow in private chats
  if (ctx.chat?.type !== "private") return;

  broadcastState[ctx.from.id] = { lang: "en" };
  await ctx.answerCbQuery();
  const userLang = (ctx.from?.language_code || "en").split("-")[0];
  await ctx.reply(
    userLang === "zh"
      ? "请发送您要广播到英文群组的消息。"
      : "Please send the message you want to broadcast to English groups.",
  );
});

bot.on(["message"], async (ctx) => {
  // Only allow in private chats
  if (ctx.chat?.type !== "private") return;

  const state = broadcastState[ctx.from?.id];
  if (!state || !state.lang) return;

  // Query group IDs from DB
  const targetGroups = await getGroupIdsByLang(state.lang);

  const userLang = (ctx.from?.language_code || "en").split("-")[0];

  if (!targetGroups.length) {
    await ctx.reply(
      userLang === "zh"
        ? "没有找到对应语言的群组，无法广播。"
        : "No groups found for the selected language. Broadcast not sent."
    );
    delete broadcastState[ctx.from.id];
    return;
  }

  // Forward the message to each group
  const msg = ctx.message as Message;
  for (const groupId of targetGroups) {
    try {
      await ctx.telegram.copyMessage(groupId, ctx.chat.id, msg.message_id);
    } catch (err) {
      console.error(`Failed to broadcast to group ${groupId}:`, err);
    }
  }

  await ctx.reply(userLang === "zh" ? "广播已发送！" : "Broadcast sent!");
  delete broadcastState[ctx.from.id];
});


export const launchBot = async () => {
  try {
    return await new Promise((resolve) => {
      bot.launch(() => {
        resolve("Bot started");
      });
    });
  } catch (error: any) {
    console.error("Error launching bot:", error.message);
    throw error;
  }
};
