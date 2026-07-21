// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("server-only authorization boundary", () => {
  it("is not imported by Client Components", () => {
    const sourceRoot = join(process.cwd(), "src");
    const sourceFiles = readdirSync(sourceRoot, {
      recursive: true,
      encoding: "utf8",
    }).filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"));

    const violatingFiles = sourceFiles.filter((relativePath) => {
      const source = readFileSync(join(sourceRoot, relativePath), "utf8");
      return (
        /^\s*["']use client["'];/m.test(source) &&
        source.includes("@/lib/auth/admin")
      );
    });

    expect(violatingFiles).toEqual([]);
  });
});
