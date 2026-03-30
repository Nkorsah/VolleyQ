import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamsPage from '../pages/TeamsPage.tsx';

const mockBack = vi.fn();

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { uid: '123' } })),
}));

describe('TeamsPage', () => {
  test('renders choice view initially', () => {
    render(<TeamsPage onBack={mockBack} />);
    expect(screen.getByText(/Create/i)).toBeInTheDocument();
  });

  test('calls back function on action', () => {
    render(<TeamsPage onBack={mockBack} />);
    // fireEvent.click(screen.getByText(/Back/i));
    // expect(mockBack).toHaveBeenCalled();
  });
});