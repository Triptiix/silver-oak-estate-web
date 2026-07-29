import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  pathname: "/admin/dashboard",
}));

vi.mock("@/app/admin/actions", () => ({
  logoutAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

import AdminDashboardPage from "@/app/admin/(protected)/dashboard/page";
import AdminOperationsError from "@/app/admin/(protected)/error";
import {
  AdminIdentityProvider,
  type SafeAdminIdentity,
} from "@/components/admin/admin-identity-context";
import { AdminRoleSummary } from "@/components/admin/admin-role-summary";
import { AdminShell } from "@/components/admin/admin-shell";

const operationsAdmin: SafeAdminIdentity = {
  name: "Operations Admin",
  role: "operations",
};

function renderProtected(
  children: React.ReactNode,
  admin: SafeAdminIdentity = operationsAdmin,
) {
  return render(
    <AdminIdentityProvider admin={admin}>
      {children}
    </AdminIdentityProvider>,
  );
}

describe("Phase 7C.1 administrator shell", () => {
  it("keeps all six destinations, labels navigation and marks the active page", () => {
    navigation.pathname = "/admin/operations";
    renderProtected(
      <AdminShell title="Controlled operations" description="Protected work.">
        <p>Workspace</p>
      </AdminShell>,
    );

    const nav = screen.getByRole("navigation", {
      name: "Administrator workspace",
    });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
    expect(screen.getByRole("link", { name: "Operations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Bookings" })).toHaveAttribute(
      "href",
      "/admin/bookings",
    );
    expect(screen.getByRole("link", { name: "Payments" })).toHaveAttribute(
      "href",
      "/admin/payments",
    );
    expect(
      screen.getByRole("link", { name: "Recovery · diagnosis only" }),
    ).toHaveAttribute("href", "/admin/recovery");
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "href",
      "/admin/notifications",
    );
  });

  it("renders safe identity, logout wiring and operational safety language", () => {
    navigation.pathname = "/admin/dashboard";
    renderProtected(
      <AdminShell title="Operations dashboard" description="Protected work.">
        <p>Workspace</p>
      </AdminShell>,
    );

    expect(screen.getByText("Operations Admin")).toBeInTheDocument();
    expect(screen.getByText("Operations", { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.getByText("Test mode only.")).toBeInTheDocument();
    expect(screen.getByText(/Live Razorpay, automatic refunds and automatic reconciliation remain disabled/)).toBeInTheDocument();
    expect(screen.getByText("Recovery is diagnosis-only")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(readFileSync("src/components/admin/admin-shell.tsx", "utf8")).toContain(
      "action={logoutAction}",
    );
    expect(screen.queryByRole("link", { name: /register|sign up/i })).not.toBeInTheDocument();
  });

  it("uses explicit types for every native admin button in the changed surface", () => {
    const source = [
      "src/app/admin/(protected)/error.tsx",
      "src/components/admin/operations/admin-operation-result.tsx",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const buttons = source.match(/<button\b[\s\S]*?>/g) ?? [];

    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toMatch(/\btype=/);
    }

    render(<AdminOperationsError reset={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Try again" })).toHaveAttribute(
      "type",
      "button",
    );
  });
});

describe("Phase 7C.1 dashboard", () => {
  it.each([
    ["operations", "Create maintenance blocks", "Owner blocks and manual-payment verification require"],
    ["admin", "Verify eligible manual-payment observations", null],
    ["super_admin", "Verify eligible manual-payment observations", null],
  ] as const)("renders the verified %s capability matrix", (role, capability, restriction) => {
    renderProtected(<AdminRoleSummary />, {
      name: "Safe Administrator",
      role,
    });

    expect(screen.getByText(capability)).toBeInTheDocument();
    if (restriction) {
      expect(screen.getByText(new RegExp(restriction))).toBeInTheDocument();
    }
  });

  it("shows only the supported generic forbidden alert", async () => {
    navigation.pathname = "/admin/dashboard";
    const { rerender } = renderProtected(
      await AdminDashboardPage({
        searchParams: Promise.resolve({ error: "forbidden" }),
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You do not have permission to perform that administrator operation.",
    );

    rerender(
      <AdminIdentityProvider admin={operationsAdmin}>
        {await AdminDashboardPage({
          searchParams: Promise.resolve({ error: "private-policy-detail" }),
        })}
      </AdminIdentityProvider>,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("private-policy-detail")).not.toBeInTheDocument();
  });

  it("keeps operational boundaries accurate without fabricated metrics or public booking", async () => {
    navigation.pathname = "/admin/dashboard";
    renderProtected(
      await AdminDashboardPage({ searchParams: Promise.resolve({}) }),
    );

    expect(screen.getByText("Recovery is diagnosis-only.")).toBeInTheDocument();
    expect(screen.getByText("Notification outbox records do not prove delivery.")).toBeInTheDocument();
    expect(screen.getByText("Manual bookings begin payment-pending.")).toBeInTheDocument();
    expect(screen.getByText("Online public booking remains disabled.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /book now/i })).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/fake metric|revenue trend|occupancy rate/i);
  });
});
