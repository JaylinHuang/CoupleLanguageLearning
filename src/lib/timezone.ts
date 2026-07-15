// 按上海时区计算「自然日」起止（用于日报 / 周报）

export function shanghaiDayRange(now = new Date()): {
  day: string;
  start: Date;
  end: Date;
} {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // YYYY-MM-DD

  return {
    day,
    start: new Date(`${day}T00:00:00+08:00`),
    end: new Date(`${day}T23:59:59.999+08:00`),
  };
}

export function formatShanghai(date: Date): string {
  return date.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
}
