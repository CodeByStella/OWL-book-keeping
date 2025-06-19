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
    });
    if (session) {
      if (!session.operators.includes(username)) {
        ctx.reply(
          session.language === "zh"
            ? "只有操作员可以开始记账。"
            : "Only operators can start bookkeeping.",
        );
        return null;
      } else {
        return session;
      }
    } else {
      ctx.reply("Session not found. Please add this bot back to this group.");
      return null;
    }
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

export const getChinaTime = async (): Promise<Date> => {
  try {
    const res = await fetch("http://worldtimeapi.org/api/timezone/Asia/Shanghai");
  if (!res.ok) {
    return new Date();
  }
  const data = await res.json();

  // `datetime` is ISO string like "2025-06-18T13:45:00.123456+08:00"
  return new Date(data.datetime.split("+")[0]);
  } catch (error) {
    console.error(error);
    return new Date();
  }
};
