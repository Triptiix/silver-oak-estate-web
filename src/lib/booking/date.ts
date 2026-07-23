export function getKolkataParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return { year, month, day };
}

export function getCurrentBusinessMonth(): string {
  const { year, month } = getKolkataParts();
  return `${year}-${month}`;
}

export function getCurrentBusinessDate(): string {
  const { year, month, day } = getKolkataParts();
  return `${year}-${month}-${day}`;
}

export function isPastBusinessDate(dateStr: string): boolean {
  const current = getCurrentBusinessDate();
  return dateStr < current;
}

export function getCheckoutDate(checkInDateStr: string): string {
  const d = new Date(`${checkInDateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
