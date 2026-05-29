export type ChatDateGroup = "Today" | "Yesterday" | "Last 7 Days" | "Older";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getChatDateGroup(dateValue?: string, nowValue: Date = new Date()): ChatDateGroup {
  if (!dateValue) return "Older";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Older";

  const today = startOfDay(nowValue);
  const target = startOfDay(date);
  const daysAgo = Math.floor((today.getTime() - target.getTime()) / DAY_MS);

  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo >= 2 && daysAgo <= 6) return "Last 7 Days";
  return "Older";
}
