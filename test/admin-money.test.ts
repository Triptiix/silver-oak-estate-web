// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseRupeesToPaise } from "@/components/admin/operations/money";

describe("manual payment INR parsing", () => {
  it.each([
    ["12500", 1_250_000],
    ["12500.50", 1_250_050],
    ["12500.5", 1_250_050],
  ])("converts %s exactly to integer paise", (value, expected) => {
    expect(parseRupeesToPaise(value)).toBe(expected);
  });

  it.each([
    "1.001",
    "-1",
    "1e3",
    "1,000",
    "0",
    "90071992547410",
  ])("rejects unsafe or malformed value %s", (value) => {
    expect(parseRupeesToPaise(value)).toBeNull();
  });

  it("does not use floating-point multiplication", () => {
    const source = readFileSync(
      "src/components/admin/operations/money.ts",
      "utf8",
    );
    expect(source).not.toMatch(/parseFloat|Number\s*\([^)]*\)\s*\*\s*100/);
  });
});
