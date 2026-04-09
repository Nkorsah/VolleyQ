// pages/api.ts
// could use zod for type verification another time
import axios from "axios";
import { auth } from "../firebase/firebase-service";
import { User } from "../types/types";
const BASE_URL = import.meta.env.VITE_SERVER_HOST;


export type CreateUserRequest = {
  userID: string;
  name: string;
  email: string;
};

export type CreateTeamRequest = {
  name: string;
};

export type JoinTeamRequest = {
  teamId: string;
};

export type Team = {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  stats: {
    wins: number;
    losses: number;
  }
};

export type AnalyzeTeamResponse = {
  analysis: string;
};

export type Marker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  createdBy: string;
  createdAt: string;
};

export type CreateMarkerRequest = {
  lat: number;
  lng: number;
  label: string;
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
    const res = await api.post(`/api/create-team`, newTeam);
    console.log('[createTeam] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
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