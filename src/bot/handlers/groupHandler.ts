import { Context, MiddlewareFn } from "telegraf";
import GroupSession from "@/models/GroupSession";
import config from "@/config";

const {
  START_BOOK_KEEPING,
  SET_RATE,
  SET_OPERATOR,
  DELETE_OPERATOR,
  DISPLAY_OPERATOR,
  DISPLAY_BILL,
  CLEAR_BILL,
} = config.COMMANDS;

const groupHandler: MiddlewareFn<Context> = async (ctx, next) => {
  const userLanguage = ctx.from?.language_code;
  console.log("User language:", userLanguage);
  if (ctx.message && "new_chat_members" in ctx.message) {
    const newMembers = (ctx.message as any).new_chat_members;
    const botId = ctx.botInfo.id;

    const isBotAdded = newMembers.some((member: any) => member.id === botId);
    if (!isBotAdded) return;
    console.log("new_chat_members");

    const groupId = String(ctx.chat.id);
    await GroupSession.deleteOne({ groupId });

    const admins = await ctx.getChatAdministrators();
    const operatorUsernames = admins
      .map((a) => a.user.username)
      .filter(
        (name): name is string =>
          typeof name === "string" &&
          (!ctx.botInfo.username || name !== ctx.botInfo.username)
      );

    await GroupSession.create({
      groupId,
      operators: operatorUsernames,
    });

    const commands = `*Available commands*
----------------------------------------
${START_BOOK_KEEPING[0]}
F+ Record funds income
F- Record funds expense
U+ Record USDT income
U- Record USDT expense
${SET_RATE[0]}+(0.00）
${SET_OPERATOR[0]}+@xxx
${DELETE_OPERATOR[0]}+@xxx
${DISPLAY_OPERATOR[0]}
${DISPLAY_BILL[0]}
${CLEAR_BILL[0]}

${START_BOOK_KEEPING[1]}
F+ 记录资金收入
F- 记录资金支出
U+ 记录 USDT 收入
U- 记录 USDT 支出
${SET_RATE[1]}+(0.00）
${SET_OPERATOR[1]}+@xxx
${DELETE_OPERATOR[1]}+@xxx
${DISPLAY_OPERATOR[1]}
${DISPLAY_BILL[1]}
${CLEAR_BILL[1]}
`;
    await ctx.reply(commands, { parse_mode: "Markdown" });
  }

  await next();
};

export default groupHandler;
