const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const plusCount = [...trimmed].filter((character) => character === "+").length;

  if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith("+"))) {
    throw new Error("invalid_phone");
  }

  const digits = trimmed.replace(/[^0-9]/g, "");
  const normalized = `${trimmed.startsWith("+") ? "+" : ""}${digits}`;
  if (!PHONE_PATTERN.test(normalized)) throw new Error("invalid_phone");
  return normalized;
}
