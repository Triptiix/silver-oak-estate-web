// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("administrator operation read model", () => {
  const databaseSource = readFileSync("src/lib/admin/database.ts", "utf8");

  it("uses the service-role client and selects only explicit safe block fields", () => {
    expect(databaseSource).toContain("createServiceRoleClient()");
    expect(databaseSource).toContain(
      '.select("id,reservation_type,status,start_at,end_at,created_at")',
    );
  });

  it("filters active owner and maintenance blocks with deterministic bounded ordering", () => {
    expect(databaseSource).toContain(
      '.in("reservation_type", ["owner_block", "maintenance_block"])',
    );
    expect(databaseSource).toContain('.eq("status", "active")');
    expect(databaseSource).toContain('.order("start_at", { ascending: true })');
    expect(databaseSource).toContain('.order("id", { ascending: true })');
    expect(databaseSource).toContain(".limit(MAX_ADMIN_ACTIVE_BLOCKS)");
    expect(databaseSource).toContain("const MAX_ADMIN_ACTIVE_BLOCKS = 100");
  });

  it("returns the internal reservation ID only in the protected read model", () => {
    const typeSource = readFileSync("src/lib/admin/types.ts", "utf8");
    expect(typeSource).toContain("reservationId: string");
    const blockType = typeSource.slice(typeSource.indexOf("export type AdminActiveInventoryBlock"));
    expect(blockType).not.toMatch(/customer|token|fingerprint|payment/i);
  });

  it("does not add a browser API endpoint for inventory operations", () => {
    expect(() => readFileSync(
      "src/app/api/admin/operations/route.ts",
      "utf8",
    )).toThrow();
  });

  it("authorizes the operations page before invoking the service-role read", () => {
    const pageSource = readFileSync(
      "src/app/admin/(protected)/operations/page.tsx",
      "utf8",
    );
    expect(pageSource.indexOf("await requireAdminRole"))
      .toBeLessThan(pageSource.indexOf("await listAdminActiveInventoryBlocks"));
    expect(pageSource).toContain('export const dynamic = "force-dynamic"');
  });
});
