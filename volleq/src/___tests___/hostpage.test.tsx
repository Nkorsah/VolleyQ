import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HostCourtPage from '../pages/HostCourtPage.tsx';

// Mock back function
const mockBack = vi.fn();

// Mock Firebase Auth if used inside the component
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { uid: '123' } })),
}));

describe('HostCourtPage', () => {
  test('renders settings view by default', () => {
    render(<HostCourtPage onBack={mockBack} />);
    expect(screen.getByText(/Host a Court/i)).toBeInTheDocument();
  });

  test('calls back function on action', () => {
    render(<HostCourtPage onBack={mockBack} />);
    // Example: simulate click if your component has a button
    // fireEvent.click(screen.getByText(/Back/i));
    // expect(mockBack).toHaveBeenCalled();
  });
});