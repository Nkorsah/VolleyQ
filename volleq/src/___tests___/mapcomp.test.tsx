import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, renderHook } from "@testing-library/react";
import { useUserStore, useUserSync } from "../store/user";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "../types/types";
import { BrowserRouter } from "react-router-dom";
import WaitlistPage from "../pages/WaitlistPage";
import Profile from "../pages/Profile";
import { MapComponent } from "../maps/mapcomp";
import { updateUser as apiUpdateUser, getVenues } from "../api/api";
import { reauthenticateUser } from "../firebase/auth";
import { createVenue, addMarker } from "../api/markers";

// --- GLOBAL MOCKS ---

// 1. Mock Firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
}));

// 2. Mock Firebase Service
vi.mock("../firebase/firebase-service", () => ({
  db: {},
}));

// 3. Mock API layers
vi.mock("../api/api", () => ({
  updateUser: vi.fn(),
  getVenues: vi.fn(),
}));

vi.mock("../api/markers", () => ({
  createVenue: vi.fn(),
  addMarker: vi.fn(),
  removeMarker: vi.fn(),
}));

// 4. Mock Auth helpers
vi.mock("../firebase/auth", () => ({
  doUpdateEmail: vi.fn(),
  reauthenticateUser: vi.fn(),
  doSignOut: vi.fn(),
  getAuth: vi.fn(() => ({
    currentUser: { getIdToken: vi.fn(() => Promise.resolve("token")) }
  })),
}));

// 5. Mock Google Maps React Wrapper
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: any) => <div>{children}</div>,
  Map: ({ children, onClick }: any) => (
    <div data-testid="google-map" onClick={() => onClick({ detail: { latLng: { lat: 40, lng: -70 } } })}>
      {children}
    </div>
  ),
  AdvancedMarker: ({ children, onClick, position }: any) => (
    <div data-testid="map-marker" data-lat={position.lat} onClick={onClick}>
      {children}
    </div>
  ),
  Pin: () => <div data-testid="map-pin" />,
  InfoWindow: ({ children, onCloseClick }: any) => (
    <div data-testid="info-window">
      <button onClick={onCloseClick}>Close</button>
      {children}
    </div>
  ),
  useMap: vi.fn(() => ({
    getCenter: () => ({ lat: () => 39, lng: () => -75 }),
  })),
}));

// 6. Mock Global Google Object (Places API)
const mockTextSearch = vi.fn();
(global as any).google = {
  maps: {
    places: {
      PlacesService: vi.fn(() => ({
        textSearch: mockTextSearch,
      })),
      PlacesServiceStatus: { OK: 'OK' },
    },
  },
};

// 7. Mock Nav and Hooks
vi.mock("../components/Navbar", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../hooks/useLoadUser", () => ({
  useLoadUser: () => ({ loadUser: vi.fn(), loading: false }),
}));

// Mock Data
const mockUserData: User = {
  userID: "owl_001",
  name: "Temple Owl",
  email: "owl@temple.edu",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Temple",
  stats: { wins: 10, losses: 5, games_played: 15 },
  createdAt: new Date(),
};

// --- SECTION 1: USER STORE & SYNC TESTS ---
describe("User Store (Zustand)", () => {
  beforeEach(() => {
    useUserStore.getState().clearUser();
    vi.clearAllMocks();
  });

  it("should update top-level fields (Partial update)", () => {
    useUserStore.getState().setUser(mockUserData);
    useUserStore.getState().updateUser({ name: "New Name", teamID: "team_123" });
    const updatedUser = useUserStore.getState().user;
    expect(updatedUser?.name).toBe("New Name");
    expect(updatedUser?.teamID).toBe("team_123");
  });
});

// --- SECTION 2: WAITLIST PAGE TESTS ---
describe("WaitlistPage Component", () => {
  const mockOnBack = vi.fn();
  it("renders the court list view by default", () => {
    render(<WaitlistPage onBack={mockOnBack} />);
    expect(screen.getByText(/Available Courts/i)).toBeInTheDocument();
  });
});

// --- SECTION 3: PROFILE PAGE TESTS ---
describe("Profile Page Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.getState().setUser(mockUserData);
  });

  it("renders user information and calculated stats correctly", () => {
    render(<BrowserRouter><Profile /></BrowserRouter>);
    expect(screen.getByText(/Temple Owl/i)).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });
});

// --- SECTION 4: MAP COMPONENT TESTS ---
describe("MapComponent", () => {
  const mockVenues = [
    {
      venueID: "v1",
      venue_name: "Temple Courts",
      marker: { lat: 39.98, lng: -75.15, label: "Temple Courts", venueID: "v1" }
    },
    {
      venueID: "v_invalid",
      venue_name: "Broken Venue",
      marker: null
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getVenues as any).mockResolvedValue(mockVenues);
    // Mock places response
    mockTextSearch.mockImplementation((req, cb) => {
      cb([{ 
        place_id: "p1", 
        name: "Suggested Park", 
        geometry: { location: { lat: () => 40, lng: () => -70 } },
        vicinity: "123 North St"
      }], 'OK');
    });
  });

  it("loads venues on mount and filters valid markers", async () => {
    render(<MapComponent userId="owl_001" />);
    
    await waitFor(() => {
      expect(getVenues).toHaveBeenCalled();
    });

    const markers = await screen.findAllByTestId("map-marker");
    expect(markers.length).toBeGreaterThanOrEqual(1);
  });

  it("opens an info window when a marker is clicked", async () => {
    render(<MapComponent userId="owl_001" />);
    
    const markers = await screen.findAllByTestId("map-marker");
    fireEvent.click(markers[0]);

    expect(screen.getByTestId("info-window")).toBeInTheDocument();
  });

  it("activates a suggested Google Place location", async () => {
    (createVenue as any).mockResolvedValue({ venueID: "new_v123" });
    
    render(<MapComponent userId="owl_001" />);
    
    const markers = await screen.findAllByTestId("map-marker");
    fireEvent.click(markers[0]);

    const activateBtn = screen.getByText(/\+ Activate Venue/i);
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(createVenue).toHaveBeenCalledWith(expect.objectContaining({
        venue_name: "Suggested Park"
      }));
      expect(addMarker).toHaveBeenCalledWith(expect.objectContaining({
        venueID: "new_v123",
        label: "Suggested Park"
      }));
    });
  });

  it("opens the creation modal when clicking empty space on the map", async () => {
    render(<MapComponent userId="owl_001" />);
    
    const mapContainer = screen.getByTestId("google-map");
    fireEvent.click(mapContainer);

    expect(screen.getByText(/Venue Description/i)).toBeInTheDocument();
    
    const nameInput = screen.getByPlaceholderText(/Venue Name/i);
    fireEvent.change(nameInput, { target: { value: "My Secret Court" } });
    
    const saveBtn = screen.getByText(/Save/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(createVenue).toHaveBeenCalled();
    });
  });
});


