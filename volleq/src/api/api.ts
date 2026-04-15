// pages/api.ts
// could use zod for type verification another time
import axios from "axios";
import { auth } from "../firebase/firebase-service";
import { User } from "../types/types";
import { Team } from "../types/types";
const BASE_URL = import.meta.env.VITE_SERVER_HOST;


export type CreateUserRequest = {
  userID: string;
  name: string;
  email: string;
};

export type CreateTeamRequest = {
  team_name: string;
  team_settings: {
    team_color: string;
    number_of_players: number;
    private: boolean;
  };
  venueID: string;
};

export type JoinTeamRequest = {
  teamId: string;
};

export type AnalyzeTeamResponse = {
  analysis: string;
};

export type Marker = {
  id: string;
  lat: number;
  lng: number;
  label: string; // also venue name
  createdBy: string;
  createdAt: string;
  venueID: string;
};

export type CreateMarkerRequest = {
  lat: number;
  lng: number;
  label: string;
  venueID: string;
};

export type CourtSettings = {
  court_name: string;
  max_teams_in_queue: number;
  queue_type: 'FIFO' | 'CIRCULAR' | 'Priority Queue';
  score_limit: number;
};

export type Court = {
  courtID: string;
  venueID: string;
  court_hostID: string;
  matchID: string;
  queueID: string;
  queue_length: number;
  court_settings: CourtSettings;
  createdAt: string;
};

export type Set = {
  teamAPoints: number;
  teamBPoints: number;
};

export type Match = {
  matchID: string;
  courtID: string;
  queueID: string;
  team1: MatchTeam | null;
  team2: MatchTeam | null;
  ongoing: boolean;
  createdAt: string;
};

export type CreateMatchRequest = {
  courtId: string;
  courtName: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  sets: Set[];
};


export type MatchTeam = {
  teamID: string;
  team_name: string;
  team_score: number;
  team_color: string;
};

export type Queue = {
  queueID: string;
  courtID: string;
  matchID: string;
  queue_type: string;
  team_queue: string[];
  createdAt: string;
};

export type HydratedQueueEntry = {
  teamID: string;
  name: string;
};

export type CreateCourtRequest = {
  court_name: string;
  max_teams_in_queue: number;
  queue_type: 'FIFO' | 'CIRCULAR' | 'Priority Queue';
  score_limit: number;
  venueID: string;
};



export type CreateCourtResponse = {
  court: Court;
  match: Match;
  queue: Queue;
};

export type Venue = {
  venueID: string;
  venue_name: string;
  venue_description: string;
  venue_creator: string;
  address: string | null;
  markerID: string | null;
  marker: object | null;
  number_of_teams: number;
  number_of_courts: number;
  createdAt: string;
  updatedAt: string | null;
};

export type CreateVenueRequest = {
  venue_name: string;
  venue_description?: string;
};

export type TeamMatchRecord = {
  matchId: string;
  opponent: { id: string; name: string };
  result: 'win' | 'loss';
  sets: Set[];
  courtId: string;
  playedAt: string;
};

type settings = {
  
}

// export type User = {
//   id: string;
//   name: string;
//   email: string;
//   avatarUrl: string;
//   role: string;
//   stats: {
//     wins: number;
//     losses: number;
//   };
//   createdAt: any;
// };

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_HOST,
});

api.interceptors.request.use(async (config) => { // interceptor middleware to add authentication token
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken(); // user should already be logged in before calling this. 
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


export const createUser = async (newUser: CreateUserRequest): Promise<User> => {
  try {
    const res = await api.post(`/api/create-user`, newUser);
    console.log('[createUser] success:', res.data);
    return res.data;
  } catch (err) {
    throw handleAxiosError(err);
  }
};



export const fetchUser = async (): Promise<User> => {
  try {
    const res = await api.get(`/api/user`);
    console.log('[fetchUser] success:', res.data);
    const data = res.data;
    return {
      ...data,
      createdAt: data.createdAt
        ? new Date(data.createdAt) // or .toDate() if Timestamp
        : null,
    };
  } catch (err) {
    throw handleAxiosError(err);
  }
};

// update user settings. Like change pfp and stuff. 
export const updateUser = async (settings: Partial<User>): Promise<User> => {
   try {
    const res = await api.put(`/api/user/update`, settings);
    console.log(`updating the following settings successful ${settings} data \n`, res.data);
    const data = res.data;
    return {
      ...data,
      createdAt: data.createdAt
        ? new Date(data.createdAt) // or .toDate() if Timestamp
        : null,
    };

  } catch (err) {
    throw handleAxiosError(err);
  }
};

export const deleteUserDataDB = async (): Promise<void> => {
  try {
    const res = await api.delete(`/api/user/delete`);

    console.log("User successfully deleted", res.data);
  } catch (err) {
    throw handleAxiosError(err);
  }
};

export const createTeam = async (newTeam: CreateTeamRequest): Promise<Team> => {
  try {
    const res = await api.post(`/api/team/create-team`, newTeam);
    console.log('[createTeam] success:', res.data);
    return res.data;
  } catch (err) {
    throw handleAxiosError(err); // 🔥 change this (don’t return)
  }
};


export const fetchTeams = async (): Promise<Team[]> => {
  try {
    const res = await api.get(`/api/teams`);
    console.log('[fetchTeams] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const joinTeam = async (teamId: string): Promise<Team> => {
  try {
    const res = await api.put(`/api/join-team/${teamId}`);
    console.log('[joinTeam] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    await api.delete(`/api/delete-team/${teamId}`);
    console.log('[deleteTeam] success');
  } catch (err) {
    return handleAxiosError(err);
  }
};


function handleAxiosError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      console.error('Request failed:', err.response.status, err.response.statusText);
    } else if (err.request) {
      console.error('Network error: no response from server');
    } else {
      console.error('Request setup error:', err.message);
    }
  } else {
    console.error('Unexpected error', err);
  }
  throw err;
}

export type StatResult = 'win' | 'loss';

export const updateTeamStats = async (teamId: string, result: StatResult): Promise<Team> => {
  try {
    const res = await api.patch(`/api/update-stats/${teamId}`, { result });
    console.log('[updateTeamStats] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const resetTeamStats = async (teamId: string): Promise<Team> => {
  try {
    const res = await api.patch(`/api/reset-stats/${teamId}`);
    console.log('[resetTeamStats] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const analyzeTeam = async (teamId: string): Promise<AnalyzeTeamResponse> => {
  try {
    const res = await axios.post(`${BASE_URL}/api/analyze-team/${teamId}`);
    console.log('[analyzeTeam] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const createMarker = async (marker: CreateMarkerRequest): Promise<Marker> => {
  try {
    const res = await axios.post(`${BASE_URL}/api/create-marker`, marker);
    console.log('[createMarker] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const fetchMarkers = async (): Promise<Marker[]> => {
  try {
    const res = await axios.get(`${BASE_URL}/api/markers`);
    console.log('[fetchMarkers] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const deleteMarker = async (markerId: string): Promise<void> => {
  try {
    await axios.delete(`${BASE_URL}/api/delete-marker/${markerId}`);
    console.log('[deleteMarker] success');
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const createVenue = async (
  venue: CreateVenueRequest
): Promise<Venue> => {
  try {
    const res = await api.post(`/api/venue/create`, venue);

    console.log('[createVenue] success:', res.data);

    return res.data;
  } catch (err) {
    throw handleAxiosError(err);
  }
};

export const getVenues = async (): Promise<Venue[]> => {
  try {
    const res = await api.get("/api/venue");

    console.log("[getVenues] success:", res.data);

    return res.data;
  } catch (err) {
    throw handleAxiosError(err);
  }
};

export const fetchTeamsAtVenue = async (venueID: string): Promise<Team[]> => {
  try {
    const res = await axios.get(`${BASE_URL}/api/venue/teams`, {
      data: { venueID },
    });
    console.log('[fetchTeamsAtVenue] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const createCourt = async (
  data: CreateCourtRequest,
  token: string
): Promise<CreateCourtResponse> => {
  try {
    const res = await axios.post(`${BASE_URL}/api/venue/court/create`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('[createCourt] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const fetchQueue = async (courtID: string): Promise<HydratedQueueEntry[]> => {
  try {
    const res = await axios.get(`${BASE_URL}/api/venue/court/${courtID}/match/queue`);
    console.log('[fetchQueue] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const joinQueue = async (courtID: string, token: string): Promise<{
  message: string;
  team: string;
  team_queue: string[];
}> => {
  try {
    const res = await axios.put(
      `${BASE_URL}/api/venue/court/${courtID}/match/queue/join`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('[joinQueue] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const advanceQueue = async (courtID: string, token: string): Promise<{
  message: string;
  removed_teamID?: string;
}> => {
  try {
    const res = await axios.put(
      `${BASE_URL}/api/venue/court/${courtID}/match/queue/advance`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('[advanceQueue] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};


export const startMatch = async (courtID: string, token: string): Promise<string> => {
  try {
    const res = await axios.put(
      `${BASE_URL}/api/venue/court/${courtID}/match/start`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('[startMatch] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const endMatch = async (courtID: string, token: string): Promise<string> => {
  try {
    const res = await axios.put(
      `${BASE_URL}/api/venue/court/${courtID}/match/end`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('[endMatch] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const submitMatch = async (match: CreateMatchRequest): Promise<Match> => {
  try {
    const res = await axios.post(`${BASE_URL}/api/submit-match`, match);
    console.log('[submitMatch] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const fetchTeamMatches = async (teamId: string): Promise<TeamMatchRecord[]> => {
  try {
    const res = await axios.get(`${BASE_URL}/api/teams/${teamId}/matches`);
    console.log('[fetchTeamMatches] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const fetchMatch = async (matchId: string): Promise<Match> => {
  try {
    const res = await axios.get(`${BASE_URL}/api/matches/${matchId}`);
    console.log('[fetchMatch] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};


// I can use a snapshot listener
// export const getVenueByID = async (): Promise<Venue[]> => {
//   try {
//     const res = await api.get("/api/venue");

//     console.log("[getVenues] success:", res.data);

//     return res.data;
//   } catch (err) {
//     throw handleAxiosError(err);
//   }
// };