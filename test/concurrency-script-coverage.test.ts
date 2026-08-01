// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

const suites = {
  "test:concurrency:booking-hold": "node test/concurrency/booking-hold.mjs",
  "test:concurrency:admin-manual-bookings":
    "node test/concurrency/admin-manual-bookings.mjs",
  "test:concurrency:admin-manual-payments":
    "node test/concurrency/admin-manual-payments.mjs",
  "test:concurrency:payment-finalization":
    "node test/concurrency/payment-finalization.mjs",
};

describe("concurrency command coverage", () => {
  it("defines every explicit concurrency suite with its intended file", () => {
    for (const [name, command] of Object.entries(suites)) {
      expect(packageJson.scripts[name]).toBe(command);
    }
  });

  it("runs every named suite exactly once, sequentially, and without backgrounding", () => {
    const aggregate = packageJson.scripts["test:concurrency"];
    expect(aggregate).not.toMatch(/(^|[^&])&([^&]|$)/);
    expect(aggregate.split(" && ")).toEqual(
      Object.keys(suites).map((name) => `npm run ${name}`),
    );
    for (const name of Object.keys(suites)) {
      expect(aggregate.match(new RegExp(`npm run ${name}`, "g"))).toHaveLength(1);
    }
  });

  it("keeps CI wired to the aggregate concurrency command", () => {
    const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
    expect(workflow).toContain("run: npm run test:concurrency");
  });
});
