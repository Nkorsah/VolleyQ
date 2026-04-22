import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, Navigate } from 'react-router-dom';
import Register from '../pages/Register.tsx';
import { useAuth } from '../contexts/authContext/index.tsx';
import * as authFuncs from '../firebase/auth.ts';
import * as apiFuncs from '../api/api.ts';
import { useUserStore } from '../store/user.ts';

// 1. Mock Navigation and Routing
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // We mock Navigate to verify redirection logic
    Navigate: vi.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
  };
});

// 2. Mock Custom Hooks and External API/Auth functions
vi.mock('../contexts/authContext/index.tsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../firebase/auth.ts', () => ({
  doCreateUserWithEmailAndPassword: vi.fn(),
}));

vi.mock('../api/api.ts', () => ({
  createUser: vi.fn(),
}));

vi.mock('../store/user.ts', () => ({
  useUserStore: vi.fn(),
}));

describe('Register Page', () => {
  const mockSetJustRegistered = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default State: User is not logged in
    (useAuth as any).mockReturnValue({ userLoggedIn: false });

    // Mock Zustand implementation for setJustRegistered
    (useUserStore as any).mockImplementation((selector: any) => {
      const state = {
        setJustRegistered: mockSetJustRegistered,
      };
      return selector(state);
    });
  });


  it('redirects to home if user is already logged in', () => {
    (useAuth as any).mockReturnValue({ userLoggedIn: true });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const navigateEl = screen.getByTestId('navigate');
    expect(navigateEl).toHaveAttribute('data-to', '/home');
  });

  it('navigates to login page when Login link is clicked', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const loginLink = screen.getByText(/Login/i, { selector: 'span' });
    fireEvent.click(loginLink);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

/* import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register'; 
import * as authFuncs from '../firebase/auth.ts';

vi.mock("../contexts/authContext/index.tsx", () => ({
  useAuth: () => ({
    currentUser: null,
    userLoggedIn: false,
    loading: false,
  }),
}));

// mock firebase auth functions
vi.mock('../firebase/auth.ts', () => ({
  doCreateUserWithEmailAndPassword: vi.fn(),
}));

// mock api calls
vi.mock('../pages/api.ts', () => ({
  createUser: vi.fn(),
}));

describe('Register Component', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and matches the snapshot', () => {
    const { asFragment } = render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    // check for essential elements
    expect(screen.getByPlaceholderText(/Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
    
    expect(asFragment()).toMatchSnapshot();
  });

  it('updates input values when the user types', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText(/Name/i) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(/Email/i) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Setter King' } });
    fireEvent.change(emailInput, { target: { value: 'volleyball@test.com' } });

    expect(nameInput.value).toBe('Setter King');
    expect(emailInput.value).toBe('volleyball@test.com');
  });

  it('shows error message if Firebase registration fails', async () => {
    // force the firebase mock to return an error
    vi.mocked(authFuncs.doCreateUserWithEmailAndPassword).mockRejectedValueOnce({
      message: "Firebase: Error (auth/email-already-in-use)."
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Name/i), { target: { value: 'Annie' } });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'error@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });

    // click the Sign Up button
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);

    // wait for the error message to appear in the DOM
    await waitFor(() => {
      // matches your <p className="error-text"> tag
      expect(screen.getByText(/Firebase: Error/i)).toBeInTheDocument();
    });
  });

  it('navigates to the login page when "Log In" is clicked', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const loginLink = screen.getByText(/Log In/i);
    expect(loginLink).toBeInTheDocument();
  });
}); */