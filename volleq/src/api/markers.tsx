import {
  createMarker as createMarkerRequest,
  fetchMarkers,
  deleteMarker as deleteMarkerRequest,
  createVenue as createVenueRequest
} from './api';
import type { Marker, CreateMarkerRequest, CreateVenueRequest } from './api';

// create venue and save to venue state if user selects

export async function addMarker(marker: CreateMarkerRequest): Promise<Marker> {
  if (!marker.label.trim()) throw new Error('Label cannot be empty');
  return createMarkerRequest(marker);
}

export async function getMarkers(): Promise<Marker[]> {
  return fetchMarkers();
}

export async function removeMarker(markerId: string): Promise<void> {
  if (!markerId) throw new Error('markerId is required');
  return deleteMarkerRequest(markerId);
}

export function canDelete(marker: Marker, userId: string): boolean {
  return marker.createdBy === userId;
}

export async function createVenue(data: CreateVenueRequest) {
  if (!data.venue_name.trim()) throw new Error("Name required");

  return createVenueRequest(data);
}

