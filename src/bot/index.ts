import config from "@/config";
import { Context, Markup, Telegraf } from "telegraf";
import { isEmpty } from "@/utils";
import groupHandler from "./handlers/groupHandler";
import bookkeepingHandler from "./handlers/bookkeepingHandler";

const bot = new Telegraf(config.BOT_TOKEN);

bot.use(groupHandler);
bot.use(bookkeepingHandler);

bot.start((ctx:Context)=>{
  try {
    ctx.reply(
      "👋 *Welcome to OwlBookKeepingBot!*\n\nTo get started, please add me to your group. I’ll help you manage your group’s bookkeeping tasks easily.\n\n👋 *欢迎使用 OwlBookKeepingBot！*\n\n请将我添加到您的群组，我将帮助您轻松管理群组的记账任务。",
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error("Error in /start handler:", error);
  }
})

export const sendMessage = async (
  chatId: string,
  text: string,
  url?: string, 
  apply?: string,
) => {
  try {
    let extra: any = undefined;

    if (!isEmpty(url) && !isEmpty(apply)) {
      extra = Markup.inlineKeyboard([
        Markup.button.url("Explore Job", url),
        Markup.button.url("Direct Apply", apply),
      ]);
    }

    await bot.telegram.sendMessage(chatId, text, extra);
  } catch (error: any) {
    console.error(`Error sending message to chat ${chatId}`, error.message);
  }
};

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
