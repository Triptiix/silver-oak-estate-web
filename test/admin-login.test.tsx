import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { loginAction } = vi.hoisted(() => ({
  loginAction: vi.fn(),
}));
vi.mock("@/app/admin/login/actions", () => ({
  loginAction,
}));

import AdminLoginPage from "@/app/admin/login/page";

describe("Admin login page", () => {
  it("renders email and password sign-in without registration", async () => {
    render(await AdminLoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Administrator sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Administrator email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Administrator email")).toHaveAttribute(
      "autocomplete",
      "username",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /register|sign up/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Administrator email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery staple" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);
    await waitFor(() => expect(loginAction).toHaveBeenCalledOnce());
    const [formData] = loginAction.mock.calls[0] as [FormData];
    expect(formData.get("email")).toBe("admin@example.com");
    expect(formData.get("password")).toBe("correct horse battery staple");
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

  it("shows safe credential errors and ignores unsupported error values", async () => {
    const { rerender } = render(
      await AdminLoginPage({
        searchParams: Promise.resolve({ error: "invalid_credentials" }),
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to sign in with those credentials.",
    );

    rerender(
      await AdminLoginPage({
        searchParams: Promise.resolve({ error: "private-database-detail" }),
      }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("private-database-detail")).not.toBeInTheDocument();
  });
});
