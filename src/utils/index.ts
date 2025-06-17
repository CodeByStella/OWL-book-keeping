import GroupSession from "@/models/GroupSession";
import { Context } from "telegraf";

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const isEmpty = (value: any): boolean => {
  if (value == null) return true; // null or undefined

  if (typeof value === "string" || Array.isArray(value)) {
    return value.length === 0;
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  return false;
};

export const isOperator = async (ctx: Context) => {
  try {
    const username = ctx.from?.username;
    const groupId = ctx.chat?.id?.toString();
    if (!username || !groupId) return null;

    const session = await GroupSession.findOne({
      groupId,
      operators: { $in: [username] }
    });
    if (!session) {
      ctx.reply("Only operators can start bookkeeping. 仅限操作员使用。");
    }
    return session || null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export function getRndId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};
