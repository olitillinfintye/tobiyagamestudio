import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminAuth, { type AuthMode } from "@/components/admin/AdminAuth";
import { cms } from "@/integrations/cpanel/client";
import { toast } from "sonner";

vi.mock("@/integrations/cpanel/client", () => ({ cms: { auth: { resetPasswordForEmail: vi.fn() } } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function AuthHarness() {
  const [mode, setMode] = useState<AuthMode>("login");
  return <MemoryRouter><AdminAuth mode={mode} onModeChange={setMode} onResetComplete={() => {}} /></MemoryRouter>;
}

describe("admin authentication", () => {
  it("offers password recovery but no public signup", () => {
    render(<AuthHarness />);
    expect(screen.queryByRole("button", { name: /sign up/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(screen.getByRole("heading", { name: "Reset your password" })).toBeInTheDocument();
  });

  it("does not claim a reset email was sent when the API fails", async () => {
    vi.mocked(cms.auth.resetPasswordForEmail).mockResolvedValue({ data: null, error: { message: "Recovery unavailable" } });
    render(<AuthHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), { target: { value: "preview@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Recovery unavailable"));
    expect(screen.queryByRole("heading", { name: "Check your inbox" })).not.toBeInTheDocument();
  });
});