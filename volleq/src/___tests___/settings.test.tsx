/** @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Settings from "../pages/Settings";
import { useAuth } from "../contexts/authContext/index";
import { doSignOut } from "../firebase/auth";

vi.mock("../contexts/authContext/index", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../firebase/auth", () => ({
  doSignOut: vi.fn(() => Promise.resolve()),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom") as any;
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("Settings Page", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      currentUser: { name: "Christine", uid: "123", email: "test@test.com" },
      loading: false,
    });
  });

  it("should call sign out and navigate when Logout is clicked", async () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    // Targets the specific button in the Danger Zone
    const logoutBtn = screen.getByRole("button", { name: /Log Out/i });
    fireEvent.click(logoutBtn);

    expect(doSignOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});