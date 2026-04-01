// pages/api.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_SERVER_HOST;


export type CreateUserRequest = {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  stats: {
    wins: number;
    losses: number;
  };
  createdAt: any;
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
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  stats: {
    wins: number;
    losses: number;
  };
  createdAt: any;
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


export const createUser = async (newUser: CreateUserRequest): Promise<User> => {
  try {
    const res = await axios.post(`${BASE_URL}/api/user-create`, newUser);
    console.log('[createUser] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const fetchUser = async (): Promise<User> => {
  try {
    const res = await axios.get(`${BASE_URL}/api/user-create`);
    console.log('[fetchUser] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};


export const createTeam = async (newTeam: CreateTeamRequest): Promise<Team> => {
  try {
    const res = await axios.post(`${BASE_URL}/api/create-team`, newTeam);
    console.log('[createTeam] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const fetchTeams = async (): Promise<Team[]> => {
  try {
    const res = await axios.get(`${BASE_URL}/api/teams`);
    console.log('[fetchTeams] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const joinTeam = async (teamId: string): Promise<Team> => {
  try {
    const res = await axios.put(`${BASE_URL}/api/join-team/${teamId}`);
    console.log('[joinTeam] success:', res.data);
    return res.data;
  } catch (err) {
    return handleAxiosError(err);
  }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    await axios.delete(`${BASE_URL}/api/delete-team/${teamId}`);
    console.log('[deleteTeam] success');
  } catch (err) {
    return handleAxiosError(err);
  }
};