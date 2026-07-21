import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/app/admin/login/actions", () => ({
  loginAction: vi.fn(),
}));

import AdminLoginPage from "@/app/admin/login/page";

describe("Admin login page", () => {
  it("renders email and password sign-in without registration", async () => {
    render(await AdminLoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Admin Login" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /register|sign up/i })).not.toBeInTheDocument();
  });

  it("shows only the safe administrator-access error", async () => {
    render(
      await AdminLoginPage({
        searchParams: Promise.resolve({ error: "unauthorized" }),
      })
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This account does not have active administrator access."
    );
  });
});
