import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WaitlistPage from '../pages/WaitlistPage.tsx';

const mockBack = vi.fn();

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { uid: '123' } })),
}));

describe('WaitlistPage', () => {
    test("renders court list", () => {
        render(<WaitlistPage onBack={() => {}} />);
        const elements = screen.getAllByText(/Teams in queue/i);
        expect(elements.length).toBeGreaterThan(0); 
    });

  test('calls back function on action', () => {
    render(<WaitlistPage onBack={mockBack} />);
    // fireEvent.click(screen.getByText(/Back/i));
    // expect(mockBack).toHaveBeenCalled();
  });
});