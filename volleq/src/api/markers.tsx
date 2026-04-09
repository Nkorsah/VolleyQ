import {
  createMarker as createMarkerRequest,
  fetchMarkers,
  deleteMarker as deleteMarkerRequest,
} from './api';
import type { Marker, CreateMarkerRequest } from './api';

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