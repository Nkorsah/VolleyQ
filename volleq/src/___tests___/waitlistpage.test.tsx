import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, renderHook } from "@testing-library/react";
import { useUserStore, useUserSync } from "../store/user";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "../types/types";
import WaitlistPage from "../pages/WaitlistPage";

// --- SECTION 1: USER STORE & SYNC TESTS ---

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

describe("User Store (Zustand)", () => {
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
    // Set low winning score for testing
    render(<WaitlistPage onBack={mockOnBack} initialWinningScore={2} />);
    fireEvent.click(screen.getByText("COURT 1"));

    const plusButtons = screen.getAllByRole("button", { name: "+" });
    
    // Score to win
    fireEvent.click(plusButtons[0]); 
    fireEvent.click(plusButtons[0]);

    expect(screen.getByText(/Game Over!/i)).toBeInTheDocument();
    expect(screen.getByText(/Team A Wins!/i)).toBeInTheDocument();

    // Reset game
    const resetBtn = screen.getByRole("button", { name: /New Match/i });
    fireEvent.click(resetBtn);

    expect(screen.queryByText(/Game Over!/i)).not.toBeInTheDocument();
    const scores = screen.getAllByText("0");
    expect(scores.length).toBeGreaterThanOrEqual(2);
  });

  it("allows a host to join and leave a queue", () => {
    render(<WaitlistPage onBack={mockOnBack} isHost={true} />);
    
    const joinBtn = screen.getAllByRole("button", { name: /Join Queue/i })[0];
    fireEvent.click(joinBtn);

    // After joining, view switches to scoreboard
    expect(screen.getByText("COURT 1")).toBeInTheDocument();
    
    // Go back and check if we can leave
    fireEvent.click(screen.getByText(/Back to Courts/i));
    const leaveBtn = screen.getByRole("button", { name: /Leave Queue/i });
    expect(leaveBtn).toBeInTheDocument();
    
    fireEvent.click(leaveBtn);
    expect(screen.queryByRole("button", { name: /Leave Queue/i })).not.toBeInTheDocument();
  });

  it("navigates to the queue detail view from the scoreboard", () => {
    render(<WaitlistPage onBack={mockOnBack} />);
    fireEvent.click(screen.getByText("COURT 1"));

    const seeQueueBtn = screen.getByText(/See Queue/i);
    fireEvent.click(seeQueueBtn);

    expect(screen.getByText(/Currently Playing/i)).toBeInTheDocument();
    expect(screen.getByText(/The Queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Team C/i)).toBeInTheDocument(); // Mocked queue data in component
  });
});