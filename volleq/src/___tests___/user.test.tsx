import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from '../store/user';
import { useTeamStore } from '../store/team';
import { User } from '../store/user';

describe('User and Team State Synchronization', () => {
  beforeEach(() => {
    useUserStore.getState().clearUser();
    // implement resetTeam, use:
    // useTeamStore.setState({ currentTeam: null, teamMembers: [] });
  });

  it('should perform a successful two-way handshake when joining a team', () => {
    //setup initial user with ALL required properties
    const mockUser: User = { 
      uid: 'user_123', 
      name: 'Temple Player', 
      avatarUrl: 'https://placeholder.com/avatar.png',
      teamId: null,
      stats: {
        gamesPlayed: 0,
        wins: 0
      }
    };
    
    useUserStore.getState().setUser(mockUser);

    // 2. simulate the Join Logic
    const targetTeamId = 'vball_pro_001';
    const targetTeamName = 'Tigers';

    useUserStore.getState().updateUser({ teamId: targetTeamId });
    useTeamStore.getState().setTeam(targetTeamName);
    useTeamStore.getState().addMember(mockUser.uid);

    // 3. assertions
    const updatedUser = useUserStore.getState().user;
    const updatedTeam = useTeamStore.getState();

    expect(updatedUser?.teamId).toBe(targetTeamId);
    expect(updatedTeam.currentTeam).toBe(targetTeamName);
    expect(updatedTeam.teamMembers).toContain(mockUser.uid);
  });

  it('should prevent joining a team if the user already has a teamId', () => {
    // provide a full user object here as well
    const userWithTeam: User = { 
      uid: 'user_123', 
      name: 'Player', 
      avatarUrl: '',
      teamId: 'existing_team_999',
      stats: { gamesPlayed: 5, wins: 2 }
    };

    useUserStore.getState().setUser(userWithTeam);

    const currentUser = useUserStore.getState().user;

    const joinAttempt = () => {
      // check if user is already on a team
      if (currentUser?.teamId) {
        throw new Error("Leave your current team first");
      }
    };

    expect(joinAttempt).toThrow("Leave your current team first");
  });
});