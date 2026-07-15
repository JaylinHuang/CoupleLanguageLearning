import { NextRequest } from "next/server";
import { generateAndSendDailyReport } from "@/lib/daily-report";

export const maxDuration = 60;

// 每天北京时间 23:00（UTC 15:00）汇总当日学习进度发给 Lin
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateAndSendDailyReport();
  return Response.json({
    sent: result.sent,
    skipped: result.skipped ?? false,
  });
}
