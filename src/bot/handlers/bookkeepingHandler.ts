import { Composer, Markup } from "telegraf";
import { getChinaTime, isOperator } from "@/utils";
import config from "@/config";
import { GroupSessionType } from "@/models/GroupSession";

const bot = new Composer();

function formatSummary(session: GroupSessionType): string {
  const rate = session.rate || 1;
  const fee = session.fee || 0;
  const funds = Array.isArray(session.funds) ? session.funds : [];
  const usdt = Array.isArray(session.usdt) ? session.usdt : [];

  const payableFunds = funds.reduce((sum, tx) => sum + tx.value, 0);
  const payableUSDT = funds.reduce(
    (sum, tx) => sum + (tx.value * (1 - tx.fee / 100)) / tx.rate,
    0,
  );
  const paidUSDT = usdt.reduce((sum, tx) => sum + tx.value, 0);
  const paidFunds = usdt.reduce(
    (sum, tx) => sum + (tx.value * tx.rate) / (1 - tx.fee / 100),
    0,
  );

  const fundSummary = [...funds]
    .splice(-3)
    .map(
      (tx, i: number) =>
        `(${i + 1}) ${tx.value} / ${tx.rate.toFixed(2)} = ${((tx.value * (1 - tx.fee / 100)) / tx.rate).toFixed(2)}`,
    )
    .join("\n");

  const usdtSummary = [...usdt]
    .splice(-3)
    .map(
      (tx, i: number) =>
        `(${i + 1}) ${tx.value} (${((tx.value * tx.rate) / (1 - tx.fee / 100)).toFixed(2)})`,
    )
    .join("\n");

  if (session.language === "zh") {
    return `
-------------------
资金（${funds.length} 笔）
${fundSummary}
${funds.length > 3 ? "...\n" : ""}
*合计: ${payableFunds.toFixed(2)}*
-------------------
USDT（${usdt.length} 笔）
${usdtSummary}
${usdt.length > 3 ? "...\n" : ""}
*合计: ${paidUSDT.toFixed(2)} USDT*
-------------------
汇率: ${rate.toFixed(2)}
费用: ${fee.toFixed(2)}
-------------------
应付: ${payableFunds.toFixed(2)} | ${payableUSDT.toFixed(2)} U
已付: ${paidFunds.toFixed(2)} | ${paidUSDT.toFixed(2)} U
未付: ${(paidFunds - payableFunds).toFixed(2)} | ${(paidUSDT - payableUSDT).toFixed(2)} U
`.trim();
  } else {
    return `
-------------------
Funds (${funds.length} orders)
${fundSummary}
${funds.length > 3 ? "...\n" : ""}
*Total: ${payableFunds.toFixed(2)}*
-------------------
USDT (${usdt.length} orders)
${usdtSummary}
${usdt.length > 3 ? "...\n" : ""}
*Total: ${paidUSDT.toFixed(2)} USDT*
-------------------
Rate: ${rate.toFixed(2)}
Fee: ${fee.toFixed(2)}
-------------------
Payable: ${payableFunds.toFixed(2)} | ${payableUSDT.toFixed(2)} U
Paid: ${paidFunds.toFixed(2)} | ${paidUSDT.toFixed(2)} U
Unpaid: ${(paidFunds - payableFunds).toFixed(2)} | ${(paidUSDT - payableUSDT).toFixed(2)} U
`.trim();
  }
}

const formatFullBill = (session: GroupSessionType) => {
  const funds = Array.isArray(session.funds) ? session.funds : [];
  const usdt = Array.isArray(session.usdt) ? session.usdt : [];

  const payableFunds = funds.reduce((sum, tx) => sum + tx.value, 0);
  const paidUSDT = usdt.reduce((sum, tx) => sum + tx.value, 0);

  const fundSummary = [...funds]
    .map(
      (tx, i: number) =>
        `(${i + 1}) ${tx.value} / ${tx.rate.toFixed(2)} = ${((tx.value * (1 - tx.fee / 100)) / tx.rate).toFixed(2)}`,
    )
    .join("\n");

  const usdtSummary = [...usdt]
    .map(
      (tx, i: number) =>
        `(${i + 1}) ${tx.value} (${((tx.value * tx.rate) / (1 - tx.fee / 100)).toFixed(2)})`,
    )
    .join("\n");

  if (session.language === "zh") {
    return `
-------------------
资金（${funds.length} 笔）
${fundSummary}
*合计: ${payableFunds.toFixed(2)}*
-------------------
USDT（${usdt.length} 笔）
${usdtSummary}
*合计: ${paidUSDT.toFixed(2)} USDT*
`.trim();
  } else {
    return `
-------------------
Funds (${funds.length} orders)
${fundSummary}
*Total: ${payableFunds.toFixed(2)}*
-------------------
USDT (${usdt.length} orders)
${usdtSummary}
*Total: ${paidUSDT.toFixed(2)} USDT*
`.trim();
  }
};

const {
  SET_CHINESE,
  SET_ENGLISH,
  SET_FEE,
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

  const language = session.language;

  if (language === "zh") {
    ctx.reply(
      `*记账已开始！*

可用命令
----------------------------------------
${START_BOOK_KEEPING[1]}
${SET_ENGLISH[1]}
+ 记录资金收入
- 记录资金支出
U+ 记录 USDT 收入
U- 记录 USDT 支出
${SET_RATE[1]}+(0.00）
${SET_FEE[1]}+(0.00）
${SET_OPERATOR[1]}+@xxx
${DELETE_OPERATOR[1]}+@xxx
${DISPLAY_OPERATOR[1]}
${DISPLAY_BILL[1]}
${CLEAR_BILL[1]}
`,
      { parse_mode: "Markdown" },
    );
  } else {
    ctx.reply(
      `*Bookkeeping started!*

Available commands
----------------------------------------
${START_BOOK_KEEPING[0]}
${SET_CHINESE[0]}
+ Record funds income
- Record funds expense
U+ Record USDT income
U- Record USDT expense
${SET_RATE[0]}+(0.00）
${SET_FEE[0]}+(0.00）
${SET_OPERATOR[0]}+@xxx
${DELETE_OPERATOR[0]}+@xxx
${DISPLAY_OPERATOR[0]}
${DISPLAY_BILL[0]}
${CLEAR_BILL[0]}
`,
      { parse_mode: "Markdown" },
    );
  }
});

//Set language as Chinese
bot.hears(SET_CHINESE, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  // Toggle language between 'en' and 'zh'
  session.language = "zh";
  await session.save?.();

  ctx.reply("语言已切换为中文。");
});

//Set language as English
bot.hears(SET_ENGLISH, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  // Toggle language between 'en' and 'zh'
  session.language = "en";
  await session.save?.();

  ctx.reply("Language switched to English.");
});

// Set rate command: e.g. Set rate+123 or 设置汇率+123
bot.hears(
  new RegExp(`^(${SET_RATE[0]}|${SET_RATE[1]})\\+([\\d.]+)$`, "i"),
  async (ctx) => {
    const session = await isOperator(ctx);
    if (!session) return;

    const language = session.language;

    const match = ctx.message.text.match(
      new RegExp(`^(${SET_RATE[0]}|${SET_RATE[1]})\\+([\\d.]+)$`, "i"),
    );
    if (!match || !match[2]) {
      if (language === "zh") {
        return ctx.reply(`格式错误。请使用 ${SET_RATE[1]}+123`);
      } else {
        return ctx.reply(`Invalid format. Please use ${SET_RATE[0]}+123`);
      }
    }
    const rate = parseFloat(match[2]);
    if (isNaN(rate) || rate <= 0) {
      if (language === "zh") {
        return ctx.reply("无效的汇率值。请输入有效的汇率。");
      } else {
        return ctx.reply("Invalid rate value. Please enter a valid rate.");
      }
    }
    session.rate = rate;
    await session.save();
    if (language === "zh") {
      ctx.reply(`汇率已设置为 ${rate}。`);
    } else {
      ctx.reply(`Rate set to ${rate}.`);
    }
  },
);

// Set fee command: e.g. Set fee+123 or 设置费用+123
bot.hears(
  new RegExp(`^(${SET_FEE[0]}|${SET_FEE[1]})\\+([\\d.]+)$`, "i"),
  async (ctx) => {
    const session = await isOperator(ctx);
    if (!session) return;

    const language = session.language;

    const match = ctx.message.text.match(
      new RegExp(`^(${SET_FEE[0]}|${SET_FEE[1]})\\+([\\d.]+)$`, "i"),
    );
    if (!match || !match[2]) {
      if (language === "zh") {
        return ctx.reply(`格式错误。请使用 ${SET_FEE[1]}+123`);
      } else {
        return ctx.reply(`Invalid format. Please use ${SET_FEE[0]}+123`);
      }
    }
    const fee = parseFloat(match[2]);
    if (isNaN(fee) || fee < 0) {
      if (language === "zh") {
        return ctx.reply("无效的手续费值。请输入有效的手续费。");
      } else {
        return ctx.reply("Invalid fee value. Please enter a valid fee.");
      }
    }
    session.fee = fee;
    await session.save();
    if (language === "zh") {
      ctx.reply(`手续费已设置为 ${fee}。`);
    } else {
      ctx.reply(`Fee set to ${fee}.`);
    }
  },
);

//set operator
bot.hears(
  new RegExp(`^(${SET_OPERATOR[0]}|${SET_OPERATOR[1]})\\+@([\\w_]+)$`, "i"),
  async (ctx) => {
    const session = await isOperator(ctx);
    if (!session) return;

    const language = session.language;

    // Extract username from message
    const match = ctx.message.text.match(
      new RegExp(`^(${SET_OPERATOR[0]}|${SET_OPERATOR[1]})\\+@([\\w_]+)$`, "i"),
    );
    if (!match || !match[2]) {
      if (language === "zh") {
        return ctx.reply(`格式错误。请使用 ${SET_OPERATOR[1]}+@用户名`);
      } else {
        return ctx.reply(
          `Invalid format. Please use ${SET_OPERATOR[0]}+@username`,
        );
      }
    }
    const username = match[2];

    // Add operator if not already present
    if (!session.operators.includes(username)) {
      session.operators.push(username);
      await session.save?.();
      if (language === "zh") {
        ctx.reply(`操作员 @${username} 添加成功。`);
      } else {
        ctx.reply(`Operator @${username} added successfully.`);
      }
    } else {
      if (language === "zh") {
        ctx.reply(`操作员 @${username} 已存在。`);
      } else {
        ctx.reply(`Operator @${username} already exists.`);
      }
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

    const language = session.language;

    // Extract username from message
    const match = ctx.message.text.match(
      new RegExp(
        `^(${DELETE_OPERATOR[0]}|${DELETE_OPERATOR[1]})\\+@([\\w_]+)$`,
        "i",
      ),
    );
    if (!match || !match[2]) {
      if (language === "zh") {
        return ctx.reply(`格式错误。请使用 ${DELETE_OPERATOR[1]}+@用户名`);
      } else {
        return ctx.reply(
          `Invalid format. Please use ${DELETE_OPERATOR[0]}+@username`,
        );
      }
    }
    const username = match[2];

    // Remove operator if present
    if (session.operators.includes(username)) {
      session.operators = session.operators.filter((u) => u !== username);
      await session.save?.();
      if (language === "zh") {
        ctx.reply(`操作员 @${username} 移除成功。`);
      } else {
        ctx.reply(`Operator @${username} removed successfully.`);
      }
    } else {
      if (language === "zh") {
        ctx.reply(`操作员 @${username} 不存在。`);
      } else {
        ctx.reply(`Operator @${username} does not exist.`);
      }
    }
  },
);

//display operator
bot.hears(DISPLAY_OPERATOR, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  const language = session.language;
  const operatorUsernames = session.operators;

  const operatorUsernamesList =
    operatorUsernames && operatorUsernames.length > 0
      ? operatorUsernames.map((u: string) => `- @${u}`).join("\n")
      : language === "zh"
        ? "未找到操作员。"
        : "No operators found.";

  if (language === "zh") {
    ctx.reply(`*操作员:*\n${operatorUsernamesList}`, {
      parse_mode: "Markdown",
    });
  } else {
    ctx.reply(`*Operators:*\n${operatorUsernamesList}`, {
      parse_mode: "Markdown",
    });
  }
});

//display bill
bot.hears(DISPLAY_BILL, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;
  const language = session.language;

  ctx.reply(
    language === "zh"
      ? `*账单:*\n${formatSummary(session)}`
      : `*Bill:*\n${formatSummary(session)}`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(
            language === "zh" ? "完整账单" : "Full bill",
            "full_bill",
          ),
        ],
      ]),
    },
  );
});

bot.action("full_bill", async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  const language = session.language;
  ctx.reply(
    language === "zh"
      ? `*完整账单:*\n${formatFullBill(session)}`
      : `*Full bill:*\n${formatFullBill(session)}`,
    {
      parse_mode: "Markdown",
    },
  );
});

//clear bill
bot.hears(CLEAR_BILL, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  session.funds = [] as typeof session.funds;
  session.usdt = [] as typeof session.usdt;
  await session.save?.();

  const language = session.language;
  if (language === "zh") {
    ctx.reply(`所有账单已清空。`, {
      parse_mode: "Markdown",
    });
  } else {
    ctx.reply(`All bills have been cleared.`, {
      parse_mode: "Markdown",
    });
  }
});

bot.hears(/^([+-]\d+(\.\d+)?|U[+-]\d+(\.\d+)?)$/i, async (ctx) => {
  const session = await isOperator(ctx);
  if (!session) return;

  const text = ctx.message.text.trim();
  const language = session.language;

  let type: "funds" | "usdt" | null = null;
  let amount: number | null = null;

  // Match for USDT: U+123 or U-123
  const usdtMatch = text.match(/^U([+-])(\d+(\.\d+)?)$/i);
  if (usdtMatch) {
    type = "usdt";
    amount = parseFloat(usdtMatch[2]);
    if (usdtMatch[1] === "-") amount = -amount;
  } else {
    // Match for funds: +123 or -123
    const fundsMatch = text.match(/^([+-])(\d+(\.\d+)?)$/);
    if (fundsMatch) {
      type = "funds";
      amount = parseFloat(fundsMatch[2]);
      if (fundsMatch[1] === "-") amount = -amount;
    }
  }

  if (type === null || amount === null || isNaN(amount) || amount === 0) {
    if (language === "zh") {
      return ctx.reply("无效的金额。请输入有效的金额。");
    } else {
      return ctx.reply("Invalid amount. Please enter a valid amount.");
    }
  }

  if (type === "funds") {
    if (!Array.isArray(session.funds))
      session.funds = [] as typeof session.funds;
    session.funds.push({
      rate: session.rate,
      fee: session.fee,
      value: amount,
    });
  } else if (type === "usdt") {
    if (!Array.isArray(session.usdt)) session.usdt = [] as typeof session.usdt;
    session.usdt.push({
      rate: session.rate,
      fee: session.fee,
      value: amount,
    });
  } else {
    if (language === "zh") {
      return ctx.reply("无效的命令。");
    } else {
      return ctx.reply("Invalid command.");
    }
  }

  await session.save?.();

  const prefixTxt =
    language === "zh"
      ? `*记账成功*\n类型：${type === "funds" ? "资金" : "USDT"}\n金额：${Math.abs(amount).toFixed(2)}\n时间(UTC+8)：${(await getChinaTime()).toLocaleString("zh-CN")}\n`
      : `*Bookkeeping Success!*\nType: ${type === "funds" ? "Funds" : "USDT"}\nAmount: ${Math.abs(amount).toFixed(2)}\nTime(UTC+8): ${(await getChinaTime()).toLocaleString("en-US")}\n`;

  ctx.reply(prefixTxt + formatSummary(session), {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback(
          language === "zh" ? "完整账单" : "Full bill",
          "full_bill",
        ),
      ],
    ]),
  });
});

export default bot;
