import { render, screen } from '@testing-library/react';
import MapComponent from '../maps/mapcomp';
import { vi, describe, it, expect } from 'vitest';

//mock setup
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mapholder">{children}</div>
  ),
  Map: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="actual-map">{children}</div>
  ),
  AdvancedMarker: () => <div data-testid="map-marker" />,
  InfoWindow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="info-window">{children}</div>
  ),
}));

//old redundant stuff i might use later idk
const mockCenter = { lat: 0, lng: 0 };
const mockZoom = 9;

describe('MapComponent', () => {
  //initialize mock api key
  beforeEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = 'mock-maps-key';
  });
  //test for google map render
  it('renders the google map', () => {
    render(<MapComponent/>);
    expect(screen.getByTestId('mapholder')).toBeInTheDocument();
  });
  //test for google map marker render
  it('renders the map and marker', () => {
    render(<MapComponent/>);
    expect(screen.getByTestId('actual-map')).toBeInTheDocument();
    expect(screen.getByTestId('map-marker')).toBeInTheDocument();
  });
  //test for api key error
  it('shows error when missing api key', () => {
    const originalEnv = process.env.GOOGLE_MAPS_API_KEY;
    process.env.GOOGLE_MAPS_API_KEY = '';

    render(<MapComponent />);
    expect(screen.getByText('Error with API key')).toBeInTheDocument();

    process.env.GOOGLE_MAPS_API_KEY = originalEnv;
  });
});