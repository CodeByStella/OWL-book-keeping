import { Composer } from "telegraf";
import { isOperator } from "@/utils";
import config from "@/config";

const bot = new Composer();

function formatSummary(session: any): string {
  const rate = session.rate || 1;
  const funds: number[] = Array.isArray(session.funds) ? session.funds : [];
  const usdt: number[] = Array.isArray(session.usdt) ? session.usdt : [];

  const totalFunds = funds.reduce((sum, val) => sum + val, 0);
  const totalUSDT = usdt.reduce((sum, val) => sum + val, 0);

  const fundSummary = funds
    .map(
      (amount: number, i: number) =>
        `(${i + 1}) ${amount} / ${rate.toFixed(2)} = ${(amount / rate).toFixed(2)}`,
    )
    .join("\n");

  const usdtSummary = usdt
    .map(
      (amount: number, i: number) =>
        `(${i + 1}) ${amount} (${(amount * rate).toFixed(2)})`,
    )
    .join("\n");

  const payableU = (totalFunds / rate).toFixed(2);
  const unpaidU = (totalUSDT - totalFunds / rate).toFixed(2);

  return `
*Bookkeeping Success!*
-------------------
Funds (${funds.length} orders)
${fundSummary}
*Total: ${totalFunds.toFixed(2)}*
-------------------
USDT (${usdt.length} orders)
${usdtSummary}
*Total: ${totalUSDT.toFixed(2)} USDT*
-------------------
Rate: ${rate.toFixed(2)}
-------------------
Payable: ${totalFunds.toFixed(2)} | ${payableU} U
Paid: ${(totalUSDT * rate).toFixed(2)} | ${totalUSDT.toFixed(2)} U
Unpaid: ${(parseFloat(unpaidU) * rate).toFixed(2)} | ${unpaidU} U


*记账成功！*
-------------------
资金（${funds.length} 笔）
${fundSummary}
*合计: ${totalFunds.toFixed(2)}*
-------------------
USDT（${usdt.length} 笔）
${usdtSummary}
*合计: ${totalUSDT.toFixed(2)} USDT*
-------------------
汇率: ${rate.toFixed(2)}
-------------------
应付: ${totalFunds.toFixed(2)} | ${payableU} U
已付: ${(totalUSDT * rate).toFixed(2)} | ${totalUSDT.toFixed(2)} U
未付: ${(parseFloat(unpaidU) * rate).toFixed(2)} | ${unpaidU} U
`.trim();
}

const {
  START_BOOK_KEEPING,
  SET_RATE,
  SET_OPERATOR,
  DELETE_OPERATOR,
  DISPLAY_OPERATOR,
  DISPLAY_BILL,
  CLEAR_BILL,
} = config.COMMANDS;

//start bookkeeping
bot.hears(START_BOOK_KEEPING, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  ctx.reply(
    `*Bookkeeping started! 记账已开始！*

Available commands
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
`,
    { parse_mode: "Markdown" },
  );
});

// Set rate command: e.g. Set rate+123 or 设置汇率+123
bot.hears(
  new RegExp(`^(${SET_RATE[0]}|${SET_RATE[1]})\\+([\\d.]+)$`, "i"),
  async (ctx) => {
    const session = await isOperator(ctx);
    if (!session) return;

    const match = ctx.message.text.match(
      new RegExp(`^(${SET_RATE[0]}|${SET_RATE[1]})\\+([\\d.]+)$`, "i"),
    );
    if (!match || !match[2]) {
      return ctx.reply(
        `Invalid format. Please use ${SET_RATE[0]}+123 or ${SET_RATE[1]}+123`,
      );
    }
    const rate = parseFloat(match[2]);
    if (isNaN(rate) || rate <= 0) {
      return ctx.reply("Invalid rate value. 请输入有效的汇率。");
    }
    session.rate = rate;
    await session.save();
    ctx.reply(`Rate set to ${rate}. 汇率已设置为 ${rate}。`);
  },
);

//set operator
bot.hears(
  new RegExp(`^(${SET_OPERATOR[0]}|${SET_OPERATOR[1]})\\+@([\\w_]+)$`, "i"),
  async (ctx) => {
    const session = await isOperator(ctx);
    if (!session) return;

    // Extract username from message
    const match = ctx.message.text.match(
      new RegExp(`^(${SET_OPERATOR[0]}|${SET_OPERATOR[1]})\\+@([\\w_]+)$`, "i"),
    );
    if (!match || !match[2]) {
      return ctx.reply(
        `Invalid format. Please use ${SET_OPERATOR[0]}+@username or ${SET_OPERATOR[1]}+@用户名`,
      );
    }
    const username = match[2];

    // Add operator if not already present
    if (!session.operators.includes(username)) {
      session.operators.push(username);
      await session.save?.();
      ctx.reply(
        `Operator @${username} added successfully. 操作员 @${username} 添加成功。`,
      );
    } else {
      ctx.reply(
        `Operator @${username} already exists. 操作员 @${username} 已存在。`,
      );
    }
  },
);

//delete operator
bot.hears(
  new RegExp(
    `^(${DELETE_OPERATOR[0]}|${DELETE_OPERATOR[1]})\\+@([\\w_]+)$`,
    "i",
  ),
  async (ctx) => {
    const session = await isOperator(ctx);
    if (!session) return;

    // Extract username from message
    const match = ctx.message.text.match(
      new RegExp(
        `^(${DELETE_OPERATOR[0]}|${DELETE_OPERATOR[1]})\\+@([\\w_]+)$`,
        "i",
      ),
    );
    if (!match || !match[2]) {
      return ctx.reply(
        `Invalid format. Please use ${DELETE_OPERATOR[0]}+@username or ${DELETE_OPERATOR[1]}+@用户名`,
      );
    }
    const username = match[2];

    // Remove operator if present
    if (session.operators.includes(username)) {
      session.operators = session.operators.filter((u) => u !== username);
      await session.save?.();
      ctx.reply(
        `Operator @${username} removed successfully. 操作员 @${username} 移除成功。`,
      );
    } else {
      ctx.reply(
        `Operator @${username} does not exist. 操作员 @${username} 不存在。`,
      );
    }
  },
);

//display operator
bot.hears(DISPLAY_OPERATOR, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  const operatorUsernames = session.operators;

  const operatorUsernamesList =
    operatorUsernames && operatorUsernames.length > 0
      ? operatorUsernames.map((u: string) => `- @${u}`).join("\n")
      : "No operators found. 未找到操作员。";

  ctx.reply(`*Operators 操作员:*\n${operatorUsernamesList}`, {
    parse_mode: "Markdown",
  });
});

//display bill
bot.hears(DISPLAY_BILL, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  ctx.reply(formatSummary(session), { parse_mode: "Markdown" });
});

//clear bill
bot.hears(CLEAR_BILL, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  session.funds = [];
  session.usdt = [];
  await session.save?.();

  ctx.reply(
    `All bills have been cleared. 所有账单已清空。`,
    { parse_mode: "Markdown" },
  );
});

bot.hears(/^([FU][+-])(\d+(\.\d+)?)$/i, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  const match = ctx.message.text.match(/^([FU][+-])(\d+(\.\d+)?)$/i);
  if (!match) return;

  const type = match[1].toUpperCase();
  const amount = parseFloat(match[2]);
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply("Invalid amount. 请输入有效的金额。");
  }

  if (type.startsWith("F")) {
    if (!Array.isArray(session.funds)) session.funds = [];
    session.funds.push(type === "F+" ? amount : -amount);
  } else if (type.startsWith("U")) {
    if (!Array.isArray(session.usdt)) session.usdt = [];
    session.usdt.push(type === "U+" ? amount : -amount);
  } else {
    return ctx.reply("Invalid command.");
  }

  await session.save?.();
  ctx.reply(formatSummary(session), { parse_mode: "Markdown" });
});

export default bot;
