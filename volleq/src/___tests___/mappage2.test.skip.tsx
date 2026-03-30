// ___tests___/mappage.test.tsx

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { uid: '123' } })),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb({ uid: '123' });
    return () => {};
  }),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import MapPage from '../pages/MapPage';
import { AuthProvider } from '../contexts/authContext';
import { describe, test, expect } from 'vitest';

describe.skip('MapPage Component', () => {
  test('renders map container', () => {
    render(
      <AuthProvider>
        <MapPage />
      </AuthProvider>
    );
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});