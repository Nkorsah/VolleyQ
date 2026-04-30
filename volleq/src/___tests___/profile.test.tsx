import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, renderHook } from "@testing-library/react";
import { useUserStore, useUserSync } from "../store/user";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "../types/types";
import { BrowserRouter } from "react-router-dom";
import WaitlistPage from "../pages/WaitlistPage";
import Profile from "../pages/Profile";
import { updateUser as apiUpdateUser } from "../api/api";
import { reauthenticateUser } from "../firebase/auth";

// --- GLOBAL MOCKS ---

// 1. Mock Firestore functions
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  getFirestore: vi.fn(),
}));

// 2. Mock Firebase Service to prevent actual DB connections
vi.mock("../firebase/firebase-service", () => ({
  db: {},
}));

// 3. Mock the API layer
vi.mock("../api/api", () => ({
  updateUser: vi.fn(),
}));

// 4. Mock Auth helpers
vi.mock("../firebase/auth", () => ({
  doUpdateEmail: vi.fn(),
  reauthenticateUser: vi.fn(),
  doSignOut: vi.fn(),
}));

// 5. Mock the load user hook
vi.mock("../hooks/useLoadUser", () => ({
  useLoadUser: () => ({
    loadUser: vi.fn(),
    loading: false
  }),
}));

// 6. Mock Navbar to prevent layout interference
vi.mock("../components/Navbar", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));

// Mock Data
const mockUserData: User = {
  userID: "owl_001",
  name: "Temple Owl",
  email: "owl@temple.edu",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Temple",
  stats: {
    wins: 10,
    losses: 5,
    games_played: 15,
  },
  createdAt: new Date(),
};

// --- SECTION 1: USER STORE & SYNC TESTS ---

describe("User Store (Zustand)", () => {
  beforeEach(() => {
    useUserStore.getState().clearUser();
    vi.clearAllMocks();
  });

  it("should initialize with null user", () => {
    const state = useUserStore.getState();
    expect(state.user).toBeNull();
    expect(state.justRegistered).toBe(false);
  });

  it("should set user data correctly", () => {
    useUserStore.getState().setUser(mockUserData);
    expect(useUserStore.getState().user?.name).toBe("Temple Owl");
    expect(useUserStore.getState().user?.userID).toBe("owl_001");
  });

  it("should update top-level fields (Partial update)", () => {
    useUserStore.getState().setUser(mockUserData);
    useUserStore.getState().updateUser({ name: "New Name", teamID: "team_123" });

    const updatedUser = useUserStore.getState().user;
    expect(updatedUser?.name).toBe("New Name");
    expect(updatedUser?.teamID).toBe("team_123");
    expect(updatedUser?.stats.wins).toBe(10);
  });

  it("should update nested stats correctly using Immer", () => {
    useUserStore.getState().setUser(mockUserData);
    
    useUserStore.getState().updateUser({
      stats: { wins: 11, games_played: 16 }
    } as any);

    const updatedUser = useUserStore.getState().user;
    expect(updatedUser?.stats.wins).toBe(11);
    expect(updatedUser?.stats.games_played).toBe(16);
    expect(updatedUser?.stats.losses).toBe(5);
  });

  it("should clear user data on logout", () => {
    useUserStore.getState().setUser(mockUserData);
    useUserStore.getState().clearUser();
    expect(useUserStore.getState().user).toBeNull();
  });
});

describe("useUserSync Hook", () => {
  const mockUser: User = {
    userID: "sync_test_user",
    name: "Sync User",
    email: "sync@test.com",
    avatarUrl: "",
    stats: { wins: 0, losses: 0, games_played: 0 },
    createdAt: new Date(),
  };

  beforeEach(() => {
    useUserStore.getState().setUser(mockUser);
    vi.clearAllMocks();
  });

  // it("should attach firestore listener when user is present", () => {
    // renderHook(() => useUserSync());
    // expect(doc).toHaveBeenCalledWith(expect.anything(), "users", "sync_test_user");
    // expect(onSnapshot).toHaveBeenCalled();
  // });

  it("should update store when firestore snapshot triggers", () => {
    let snapshotCallback: any;
    (onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
      snapshotCallback = callback;
      return () => {};
    });

    renderHook(() => useUserSync());

    const dbUpdate = {
      exists: () => true,
      data: () => ({ teamID: "new_team_alpha", team_name: "The Raptors" })
    };

    snapshotCallback(dbUpdate);

    const updatedUser = useUserStore.getState().user;
    expect(updatedUser?.teamID).toBe("new_team_alpha");
    expect(updatedUser?.team_name).toBe("The Raptors");
  });
});

// --- SECTION 2: WAITLIST PAGE TESTS ---

describe("WaitlistPage Component", () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the court list view by default", () => {
    render(<WaitlistPage onBack={mockOnBack} />);
    expect(screen.getByText(/Available Courts/i)).toBeInTheDocument();
    expect(screen.getByText("COURT 1")).toBeInTheDocument();
    expect(screen.getByText("COURT 2")).toBeInTheDocument();
  });

  it("shows player-only status bar when not a host", () => {
    render(<WaitlistPage onBack={mockOnBack} isHost={false} />);
    expect(screen.getByText(/Host is currently selecting a court/i)).toBeInTheDocument();
  });

  it("shows management controls when user is host", () => {
    render(<WaitlistPage onBack={mockOnBack} isHost={true} />);
    expect(screen.getByText(/Court Management/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Join Queue/i }).length).toBeGreaterThan(0);
  });

  it("navigates to scoreboard when a court card is clicked", () => {
    render(<WaitlistPage onBack={mockOnBack} />);
    const courtOne = screen.getByText("COURT 1");
    fireEvent.click(courtOne);
    expect(screen.getByText(/Match Goal:/i)).toBeInTheDocument();
    expect(screen.getByText("Team A")).toBeInTheDocument();
  });

  it("updates score correctly when + and - buttons are clicked", () => {
    render(<WaitlistPage onBack={mockOnBack} />);
    fireEvent.click(screen.getByText("COURT 1"));

    const plusButtons = screen.getAllByRole("button", { name: "+" });
    const minusButtons = screen.getAllByRole("button", { name: "-" });

    fireEvent.click(plusButtons[0]); // Team A +1
    fireEvent.click(plusButtons[0]); // Team A +1
    fireEvent.click(minusButtons[0]); // Team A -1

    expect(screen.getByText("1")).toBeInTheDocument(); // Score A
  });

  it("declares a winner when score reaches goal and allows reset", async () => {
    render(<WaitlistPage onBack={mockOnBack} initialWinningScore={2} />);
    fireEvent.click(screen.getByText("COURT 1"));

    const plusButtons = screen.getAllByRole("button", { name: "+" });
    
    fireEvent.click(plusButtons[0]); 
    fireEvent.click(plusButtons[0]);

    expect(screen.getByText(/Game Over!/i)).toBeInTheDocument();
    expect(screen.getByText(/Team A Wins!/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /New Match/i });
    fireEvent.click(resetBtn);

    expect(screen.queryByText(/Game Over!/i)).not.toBeInTheDocument();
    const scores = screen.getAllByText("0");
    expect(scores.length).toBeGreaterThanOrEqual(2);
  });
});

// --- SECTION 3: PROFILE PAGE TESTS ---

describe("Profile Page Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.getState().setUser(mockUserData);
  });

  it("renders user information and calculated stats correctly", () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    // Name from mock
    expect(screen.getByText(/Temple Owl/i)).toBeInTheDocument();
    
    // Stats verification: 15 games, 10 wins = 66.66% winrate
    expect(screen.getByText("15")).toBeInTheDocument(); // Matches Played
    expect(screen.getByText(/66.666/i)).toBeInTheDocument(); // Win Rate
    
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  /* it("opens the edit modal when 'Edit Profile' is clicked", () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    const editBtn = screen.getByRole("button", { name: /Edit Profile/i });
    fireEvent.click(editBtn);

    expect(screen.getByText(/Edit Player Profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Display Name/i)).toHaveValue("Temple Owl");
  });
*/
  
/*
  it("updates inputs in the modal and calls API on save", async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Edit Profile/i }));

    const nameInput = screen.getByLabelText(/Display Name/i);
    fireEvent.change(nameInput, { target: { value: "Updated Owl" } });

    // Click 'Advanced' skill level
    const advancedBtn = screen.getByRole("button", { name: /Advanced/i });
    fireEvent.click(advancedBtn);

    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
        name: "Updated Owl"
      }));
    });
  });
  */
  

  it("toggles privacy visibility and hides elements from the main view", async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Edit Profile/i }));

    // Find and click the 'Show Stats' toggle
    const statsToggleLabel = screen.getByText(/Show Stats/i);
    const statsToggleBtn = statsToggleLabel.nextElementSibling as HTMLButtonElement;
    fireEvent.click(statsToggleBtn);

    // Close modal (in this component, Save Changes or manual logic closes it)
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    // Wait for modal to close and check if stats container is gone
    await waitFor(() => {
      expect(screen.queryByText("Matches Played")).not.toBeInTheDocument();
    });
  });

  /*

  it("shows the password confirmation modal when the email is changed", async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Edit Profile/i }));

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: "new-email@temple.edu" } });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    // Check for Password Modal
    expect(screen.getByText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Current password/i)).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText(/Current password/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const confirmBtn = screen.getByRole("button", { name: /Confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(reauthenticateUser).toHaveBeenCalledWith("password123");
    });
  });
  */

  it("closes the edit modal when the '×' button is clicked", () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Edit Profile/i }));
    const closeBtn = screen.getByText("×");
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Edit Player Profile/i)).not.toBeInTheDocument();
  });
});