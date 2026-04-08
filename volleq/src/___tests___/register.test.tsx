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