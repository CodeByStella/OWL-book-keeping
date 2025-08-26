import { configDotenv } from "dotenv";

configDotenv();

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI;

let config_missing = false;

if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN");
  config_missing = true;
}

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  config_missing = true;
}

if (config_missing) {
  process.exit(1);
}

const commands = {
  SET_CHINESE: ["Set Language Chinese", "设置语言为中文"],
  SET_ENGLISH: ["Set Language English", "设置语言为英文"],
  START_BOOK_KEEPING: ["Start bookkeeping", "开始记账", "Z2", "z2"],
  SET_RATE: ["Set rate", "设置汇率"],
  SET_FEE: ["Set fee", "设置费用"],
  SET_OPERATOR: ["Set operator", "设置操作人"],
  DELETE_OPERATOR: ["Delete operator", "删除操作人"],
  DISPLAY_OPERATOR: ["Display operators", "显示操作人"],
  DISPLAY_BILL: ["Display bill", "显示账单", "Z0", "z0"],
  CLEAR_BILL: ["Clear bill", "清除账单", "Q0", "q0"],
  CANCEL_DEPOSIT: ["Cancel deposit", "删除上一条账单"],
};
interface Config {
  BOT_TOKEN: string;
  MONGODB_URI: string;
  COMMANDS: typeof commands;
}

const config: Config = {
  BOT_TOKEN: BOT_TOKEN!,
  MONGODB_URI: MONGODB_URI!,
  COMMANDS: commands,
};

export default config;
