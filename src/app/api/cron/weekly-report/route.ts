import { NextRequest } from "next/server";
import { generateAndSendWeeklyReport } from "@/lib/weekly-report";

export const maxDuration = 60;

// Vercel Cron：北京时间周一 00:00 = UTC 周日 16:00（即周日晚上十二点）
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateAndSendWeeklyReport();
  return Response.json({ sent: result.sent });
}
