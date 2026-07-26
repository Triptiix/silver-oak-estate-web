import "server-only";
import { timingSafeEqual } from "node:crypto";

export function secretsEqual(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  const left = Buffer.from(actual); const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
