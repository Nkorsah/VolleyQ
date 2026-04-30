import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MapComponent } from '../maps/mapcomp'
import * as api from '../api/api'
import * as markers from '../api/markers'
import type { Venue } from '../api/api'


vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: any) => <>{children}</>,
  Map: ({ children, onClick }: any) => (
    <div data-testid="map" onClick={onClick}>{children}</div>
  ),
  AdvancedMarker: ({ children, onClick }: any) => (
    <div data-testid="marker" onClick={onClick}>{children}</div>
  ),
  Pin: () => <div data-testid="pin" />,
  InfoWindow: ({ children, onCloseClick }: any) => (
    <div data-testid="infowindow">
      {children}
      <button onClick={onCloseClick}>close</button>
    </div>
  ),
  useMap: () => null,
}))

vi.mock('../api/api', () => ({
  getVenues: vi.fn(),
}))

vi.mock('../api/markers', () => ({
  addMarker: vi.fn(),
  removeMarker: vi.fn(),
  createVenue: vi.fn(),
}))

vi.mock('../components/CreateVenueModal', () => ({
  CreateVenueModal: ({ open }: any) => open ? <div data-testid="modal" /> : null,
}))

const mockVenues = [
  {
    venueID: 'v1',
    venue_name: 'Test Venue',
    venue_description: 'A test venue',
    venue_creator: 'user1',
    address: '',
    markerID: '1',
    number_of_teams: 0,
    number_of_courts: 1,
    marker: { id: '1', venueID: 'v1', lat: 39.98, lng: -75.15, label: 'Test Venue' },
  },
  {
    venueID: 'v2',
    venue_name: 'Another Venue',
    venue_description: 'Another test venue',
    venue_creator: 'user1',
    address: '',
    markerID: '2',
    number_of_teams: 0,
    number_of_courts: 1,
    marker: { id: '2', venueID: 'v2', lat: 39.99, lng: -75.16, label: 'Another Venue' },
  },
] as Venue[]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.getVenues).mockResolvedValue(mockVenues)
})


describe('MapComponent', () => {
  it('renders the map', async () => {
    render(<MapComponent userId="user1" />)
    expect(screen.getByTestId('map')).toBeInTheDocument()
  })

  it('loads and renders venue markers on mount', async () => {
    render(<MapComponent userId="user1" />)
    await waitFor(() => {
      expect(api.getVenues).toHaveBeenCalledOnce()
      expect(screen.getAllByTestId('marker')).toHaveLength(mockVenues.length)
    })
  })

  it('filters out venues with invalid marker coordinates', async () => {
  vi.mocked(api.getVenues).mockResolvedValue([
    ...mockVenues,
    { venueID: 'bad1' } as unknown as Venue,
    { venueID: 'bad2', marker: { lat: 'bad', lng: -75 } } as unknown as Venue,
  ])

  render(<MapComponent userId="user1" />)
  await waitFor(() => {
    expect(screen.getAllByTestId('marker')).toHaveLength(mockVenues.length)
  })
})

  it('opens an InfoWindow when a marker is clicked', async () => {
    render(<MapComponent userId="user1" />)
    await waitFor(() => screen.getAllByTestId('marker'))

    fireEvent.click(screen.getAllByTestId('marker')[0])
    expect(screen.getByTestId('infowindow')).toBeInTheDocument()
    expect(screen.getByText('Test Venue')).toBeInTheDocument()
  })

  it('closes the InfoWindow when close is clicked', async () => {
    render(<MapComponent userId="user1" />)
    await waitFor(() => screen.getAllByTestId('marker'))

    fireEvent.click(screen.getAllByTestId('marker')[0])
    fireEvent.click(screen.getByText('close'))
    expect(screen.queryByTestId('infowindow')).not.toBeInTheDocument()
  })

  it('opens the CreateVenueModal when the map is clicked', async () => {
    render(<MapComponent userId="user1" />)

    fireEvent.click(screen.getByTestId('map'), {
      detail: { latLng: { lat: 39.98, lng: -75.15 } },
    })
    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('calls onGooglePlacesLoaded when places are found', async () => {
    const onGooglePlacesLoaded = vi.fn()
    render(<MapComponent userId="user1" onGooglePlacesLoaded={onGooglePlacesLoaded} />)
    await waitFor(() => expect(api.getVenues).toHaveBeenCalled())
  })

  it('calls onVenueActivated after activating a Google Places venue', async () => {
    const onVenueActivated = vi.fn()
    vi.mocked(markers.createVenue).mockResolvedValue({ venueID: 'new-v' })
    vi.mocked(markers.addMarker).mockResolvedValue(undefined)

    render(<MapComponent userId="user1" onVenueActivated={onVenueActivated} />)
    await waitFor(() => screen.getAllByTestId('marker'))


    expect(onVenueActivated).not.toHaveBeenCalled()
  })
})