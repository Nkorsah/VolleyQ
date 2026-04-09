import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../pages/Profile';
import { useUserStore } from '../store/user';

// mock the Navbar to simplify testing the Profile page specifically
vi.mock("../components/Navbar", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));

// mock the Zustand User Store
vi.mock('../store/user', () => ({
  useUserStore: vi.fn(),
}));

describe('Profile Component', () => {
  const mockUser = {
    uid: '123',
    name: 'Christine Smith',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Christine',
    stats: {
      gamesPlayed: 42,
      wins: 28,
    },
    teamId: 'team_01'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Robust Zustand Mock Implementation
    (useUserStore as any).mockImplementation((selector?: (state: any) => any) => {
      const state = {
        user: mockUser,
      };
      return selector ? selector(state) : state;
    });
  });

  it('renders the profile with initial user data from the store', () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Christine Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/📍 Philadelphia, PA/i)).toBeInTheDocument();
    expect(screen.getByText(/Skill: Intermediate/i)).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('renders stats sections by default', () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Matches Played/i)).toBeInTheDocument();
    expect(screen.getByText(/Win Rate/i)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('toggles privacy settings and hides elements in the main view', async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));
    
    // Find toggle buttons by their sibling labels
    const locationToggle = screen.getByText(/Show Location/i).closest('div')?.querySelector('button');
    const statsToggle = screen.getByText(/Show Stats/i).closest('div')?.querySelector('button');
    
    if (locationToggle) fireEvent.click(locationToggle);
    if (statsToggle) fireEvent.click(statsToggle);
    
    // Close modal via Save Changes
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/📍 Location Hidden/i)).toBeInTheDocument();
      expect(screen.queryByText(/Matches Played/i)).not.toBeInTheDocument();
    });
  });

  it('changes skill level and applies correct badge styles', () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));
    
    const advancedBtn = screen.getByRole('button', { name: /^Advanced$/i });
    fireEvent.click(advancedBtn);
    
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    
    const skillBadge = screen.getByText(/Skill: Advanced/i);
    expect(skillBadge).toBeInTheDocument();
    // Advanced color is 'bg-red-500' per component logic
    expect(skillBadge).toHaveClass('bg-red-500');
  });

  it('closes the modal when the "×" button is clicked', () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));
    
    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);
    
    expect(screen.queryByText(/Edit Player Profile/i)).not.toBeInTheDocument();
  });
});