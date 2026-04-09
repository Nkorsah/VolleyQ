
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MapComponent } from '../maps/mapcomp';
import type { Marker } from '../api/api';

const { mockGetMarkers, mockAddMarker, mockRemoveMarker, mockCanDelete } = vi.hoisted(() => ({
  mockGetMarkers: vi.fn(),
  mockAddMarker: vi.fn(),
  mockRemoveMarker: vi.fn(),
  mockCanDelete: vi.fn(),
}));

vi.mock('../api/markers', () => ({
  getMarkers: mockGetMarkers,
  addMarker: mockAddMarker,
  removeMarker: mockRemoveMarker,
  canDelete: mockCanDelete,
}));


vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: any) => (
    <div data-testid="api-provider">{children}</div>
  ),
  Map: ({ children, onClick }: any) => (
    <div
      data-testid="map"
      onClick={() => onClick?.({
        detail: { latLng: { lat: 39.9812, lng: -75.1554 } }
      })}
    >
      {children}
    </div>
  ),
  AdvancedMarker: ({ children, onClick, position }: any) => (
    <div
      data-testid="advanced-marker"
      data-lat={position?.lat}
      data-lng={position?.lng}
      onClick={onClick}
    >
      {children}
    </div>
  ),
  InfoWindow: ({ children, onCloseClick }: any) => (
    <div data-testid="info-window">
      {children}
      <button data-testid="close-info-window" onClick={onCloseClick}>
        Close
      </button>
    </div>
  ),
  Pin: () => <div data-testid="pin" />,
}));


const mockMarker: Marker = {
  id: 'marker-1',
  lat: 39.9812,
  lng: -75.1554,
  label: 'Test Marker',
  createdBy: 'user-1',
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockMarker2: Marker = {
  id: 'marker-2',
  lat: 39.99,
  lng: -75.16,
  label: 'Second Marker',
  createdBy: 'user-2',
  createdAt: '2024-01-02T00:00:00.000Z',
};


beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mockGetMarkers.mockResolvedValueOnce([]);
  mockCanDelete.mockReturnValue(false);
});

afterEach(() => {
  vi.resetAllMocks();
  cleanup();
});


describe('rendering', () => {
  it('renders the map', async () => {
    render(<MapComponent userId="user-1" />);

    expect(screen.getByTestId('map')).toBeDefined();
  });

  it('renders the API provider', async () => {
    render(<MapComponent userId="user-1" />);

    expect(screen.getByTestId('api-provider')).toBeDefined();
  });

  it('loads markers on mount', async () => {
    render(<MapComponent userId="user-1" />);

    await waitFor(() => {
      expect(mockGetMarkers).toHaveBeenCalledTimes(1);
    });
  });

  it('renders a marker for each loaded marker', async () => {
    mockGetMarkers.mockReset();
    mockGetMarkers.mockResolvedValueOnce([mockMarker, mockMarker2]);

    render(<MapComponent userId="user-1" />);

    await waitFor(() => {
      expect(screen.getAllByTestId('advanced-marker')).toHaveLength(2);
    });
  });

  it('shows error if markers fail to load', async () => {
    mockGetMarkers.mockReset();
    mockGetMarkers.mockRejectedValueOnce(new Error('Network error'));

    render(<MapComponent userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load markers')).toBeDefined();
    });
  });
});

describe('placing a marker', () => {
  it('shows input when map is clicked', async () => {
    render(<MapComponent userId="user-1" />);

    fireEvent.click(screen.getByTestId('map'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Marker label')).toBeDefined();
    });
  });

  it('shows save and cancel buttons when map is clicked', async () => {
    render(<MapComponent userId="user-1" />);

    fireEvent.click(screen.getByTestId('map'));

    expect(screen.getByText('Save')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('saves a marker with the entered label', async () => {
    mockAddMarker.mockResolvedValueOnce(mockMarker);

    render(<MapComponent userId="user-1" />);
    fireEvent.click(screen.getByTestId('map'));

    fireEvent.change(screen.getByPlaceholderText('Marker label'), {
      target: { value: 'Test Marker' },
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockAddMarker).toHaveBeenCalledWith({
        lat: 39.9812,
        lng: -75.1554,
        label: 'Test Marker',
      });
    });
  });

  it('saves a marker with default label if input is empty', async () => {
    mockAddMarker.mockResolvedValueOnce(mockMarker);

    render(<MapComponent userId="user-1" />);
    fireEvent.click(screen.getByTestId('map'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockAddMarker).toHaveBeenCalledWith({
        lat: 39.9812,
        lng: -75.1554,
        label: 'New Marker',
      });
    });
  });

  it('shows error if saving a marker fails', async () => {
    mockAddMarker.mockRejectedValueOnce(new Error('Network error'));

    render(<MapComponent userId="user-1" />);

    await waitFor(() => expect(mockGetMarkers).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('map'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Marker label')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Failed to save marker')).toBeDefined();
    }, { timeout: 3000 });
  });
});


