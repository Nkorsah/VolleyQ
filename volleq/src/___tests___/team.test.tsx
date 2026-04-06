import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTeam,
  getTeams,
  joinTeam,
  deleteTeam,
  isOwner,
  isMember,
  getMemberCount,
} from "../api/teamcreation";
import * as api from "../api/api";
import type { Team } from "../api/api";

vi.mock("../pages/api", () => ({
  createTeam: vi.fn(),
  fetchTeams: vi.fn(),
  joinTeam: vi.fn(),
  deleteTeam: vi.fn(),
}));

const mockTeam: Team = {
  id: "team-1",
  name: "Engineering",
  ownerId: "user-1",
  memberIds: ["user-1", "user-2"],
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockTeam2: Team = {
  id: "team-2",
  name: "Design",
  ownerId: "user-3",
  memberIds: ["user-3"],
  createdAt: "2024-01-02T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createTeam", () => {
  it("calls api.createTeam with the correct name", async () => {
    vi.mocked(api.createTeam).mockResolvedValue(mockTeam);

    await createTeam("Engineering");

    expect(api.createTeam).toHaveBeenCalledWith({ name: "Engineering" });
    expect(api.createTeam).toHaveBeenCalledTimes(1);
  });

  it("returns the created team", async () => {
    vi.mocked(api.createTeam).mockResolvedValue(mockTeam);

    const result = await createTeam("Engineering");

    expect(result).toEqual(mockTeam);
  });

  it("throws if name is empty", async () => {
    await expect(createTeam("")).rejects.toThrow("Team name cannot be empty");
    expect(api.createTeam).not.toHaveBeenCalled();
  });

  it("throws if name is only whitespace", async () => {
    await expect(createTeam("   ")).rejects.toThrow(
      "Team name cannot be empty",
    );
    expect(api.createTeam).not.toHaveBeenCalled();
  });

  it("throws if api.createTeam fails", async () => {
    vi.mocked(api.createTeam).mockRejectedValue(new Error("Network error"));

    await expect(createTeam("Engineering")).rejects.toThrow("Network error");
  });
});

describe("getTeams", () => {
  it("returns a list of teams", async () => {
    vi.mocked(api.fetchTeams).mockResolvedValue([mockTeam, mockTeam2]);

    const result = await getTeams();

    expect(result).toEqual([mockTeam, mockTeam2]);
    expect(api.fetchTeams).toHaveBeenCalledTimes(1);
  });

  it("returns an empty array if user has no teams", async () => {
    vi.mocked(api.fetchTeams).mockResolvedValue([]);

    const result = await getTeams();

    expect(result).toEqual([]);
  });

  it("throws if api.fetchTeams fails", async () => {
    vi.mocked(api.fetchTeams).mockRejectedValue(new Error("Network error"));

    await expect(getTeams()).rejects.toThrow("Network error");
  });
});

describe("joinTeam", () => {
  it("calls api.joinTeam with the correct teamId", async () => {
    vi.mocked(api.joinTeam).mockResolvedValue(mockTeam);

    await joinTeam("team-1");

    expect(api.joinTeam).toHaveBeenCalledWith("team-1");
    expect(api.joinTeam).toHaveBeenCalledTimes(1);
  });

  it("returns the updated team", async () => {
    vi.mocked(api.joinTeam).mockResolvedValue(mockTeam);

    const result = await joinTeam("team-1");

    expect(result).toEqual(mockTeam);
  });

  it("throws if teamId is empty", async () => {
    await expect(joinTeam("")).rejects.toThrow("teamId is required");
    expect(api.joinTeam).not.toHaveBeenCalled();
  });

  it("throws if api.joinTeam fails", async () => {
    vi.mocked(api.joinTeam).mockRejectedValue(new Error("Team not found"));

    await expect(joinTeam("team-1")).rejects.toThrow("Team not found");
  });
});

describe("deleteTeam", () => {
  it("calls api.deleteTeam with the correct teamId", async () => {
    vi.mocked(api.deleteTeam).mockResolvedValue(undefined);

    await deleteTeam("team-1");

    expect(api.deleteTeam).toHaveBeenCalledWith("team-1");
    expect(api.deleteTeam).toHaveBeenCalledTimes(1);
  });

  it("throws if teamId is empty", async () => {
    await expect(deleteTeam("")).rejects.toThrow("teamId is required");
    expect(api.deleteTeam).not.toHaveBeenCalled();
  });

  it("throws if api.deleteTeam fails", async () => {
    vi.mocked(api.deleteTeam).mockRejectedValue(
      new Error("Only the owner can delete a team"),
    );

    await expect(deleteTeam("team-1")).rejects.toThrow(
      "Only the owner can delete a team",
    );
  });
});

describe("isOwner", () => {
  it("returns true if userId matches ownerId", () => {
    expect(isOwner(mockTeam, "user-1")).toBe(true);
  });

  it("returns false if userId does not match ownerId", () => {
    expect(isOwner(mockTeam, "user-2")).toBe(false);
  });

  it("returns false for an unrelated user", () => {
    expect(isOwner(mockTeam, "user-99")).toBe(false);
  });
});

describe("isMember", () => {
  it("returns true if userId is in memberIds", () => {
    expect(isMember(mockTeam, "user-2")).toBe(true);
  });

  it("returns true for the owner", () => {
    expect(isMember(mockTeam, "user-1")).toBe(true);
  });

  it("returns false if userId is not in memberIds", () => {
    expect(isMember(mockTeam, "user-99")).toBe(false);
  });
});

describe("getMemberCount", () => {
  it("returns the correct member count", () => {
    expect(getMemberCount(mockTeam)).toBe(2);
  });

  it("returns 1 for a team with only the owner", () => {
    expect(getMemberCount(mockTeam2)).toBe(1);
  });

  it("returns 0 for a team with no members", () => {
    const emptyTeam = { ...mockTeam, memberIds: [] };
    expect(getMemberCount(emptyTeam)).toBe(0);
  });
});
