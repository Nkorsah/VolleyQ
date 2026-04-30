import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUserStore, useUserSync } from "../store/user.ts";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "../types/types";

// 1. Mock Firestore functions
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  getFirestore: vi.fn(),
}));

// 2. Mock Firebase Service to prevent actual DB connections
vi.mock("../firebase/firebase-service.ts", () => ({
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
    // Clear Zustand state and mocks before each test
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
    // Ensure stats weren't lost
    expect(updatedUser?.stats.wins).toBe(10);
  });

  it("should update nested stats correctly using Immer", () => {
    useUserStore.getState().setUser(mockUserData);
    
    // Increment wins only
    useUserStore.getState().updateUser({
      stats: { wins: 11, games_played: 16 }
    } as any);

    const updatedUser = useUserStore.getState().user;
    expect(updatedUser?.stats.wins).toBe(11);
    expect(updatedUser?.stats.games_played).toBe(16);
    // CRITICAL: Ensure losses (which wasn't in the update) is still there
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

  it("should not attach listener if no userID is present", () => {
    useUserStore.getState().clearUser();
    renderHook(() => useUserSync());
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("should update store when firestore snapshot triggers", () => {
    let snapshotCallback: any;
    
    // Capture the callback function passed to onSnapshot
    (onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
      snapshotCallback = callback;
      return () => {}; // Return a dummy unsubscribe function
    });

    renderHook(() => useUserSync());

    // Simulate database pushing a team assignment
    const dbUpdate = {
      exists: () => true,
      data: () => ({ teamID: "new_team_alpha", team_name: "The Raptors" })
    };

    snapshotCallback(dbUpdate);

    const updatedUser = useUserStore.getState().user;
    expect(updatedUser?.teamID).toBe("new_team_alpha");
    expect(updatedUser?.team_name).toBe("The Raptors");
  });

  it("should cleanup/unsubscribe when unmounted", () => {
    const unsubscribeMock = vi.fn();
    (onSnapshot as any).mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useUserSync());
    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});