export function parseRupeesToPaise(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;

  const rupees = BigInt(match[1]);
  const fractional = BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  const paise = (rupees * BigInt(100)) + fractional;

  if (paise <= BigInt(0) || paise > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(paise);
}
