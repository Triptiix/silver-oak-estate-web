import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/lib/phone";

describe("phone normalization", () => {
  it.each([
    ["+91 98765 43210", "+919876543210"],
    ["+91-98765-43210", "+919876543210"],
    ["+91 (98765) 43210", "+919876543210"],
    ["98765 43210", "9876543210"],
  ])("normalizes %s without inferring country context", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    "+91+9876543210",
    "91+9876543210",
    "123456",
    "1234567890123456",
    "phone",
    "",
  ])("rejects invalid phone %s", (input) => {
    expect(() => normalizePhone(input)).toThrow("invalid_phone");
  });

  it("does not add a country code or leading plus", () => {
    expect(normalizePhone("9876543210")).toBe("9876543210");
  });
});
