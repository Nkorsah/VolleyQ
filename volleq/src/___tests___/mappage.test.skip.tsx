import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MapPage from './pages/MapPage.tsx';
import { useAuth } from './contexts/authContext/index.tsx';
import { doSignOut } from './firebase/auth.ts';

vi.mock('../contexts/authContext/index.tsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../firebase/auth.ts', () => ({
  doSignOut: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MapPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the map page content for a logged-in user', () => {
    // simulate a logged-in user named "baller"
    (useAuth as any).mockReturnValue({
      currentUser: { displayName: 'Baller', email: 'baller@gmail.com' },
      userLoggedIn: true,
      loading: false,
    });

    render(
      <BrowserRouter>
        <MapPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/This is the map page/i)).toBeInTheDocument();
  });

  it('calls doSignOut and navigates to login on logout click', async () => {
    (useAuth as any).mockReturnValue({
      currentUser: { displayName: 'Spike' },
      userLoggedIn: true,
      loading: false,
    });

    render(
      <BrowserRouter>
        <MapPage />
      </BrowserRouter>
    );

    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);

    expect(doSignOut).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles logout errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (doSignOut as any).mockRejectedValueOnce(new Error('Logout Failed'));

    render(
      <BrowserRouter>
        <MapPage />
      </BrowserRouter>
    );

    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error logging out:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
});