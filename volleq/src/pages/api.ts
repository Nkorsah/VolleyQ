// src/api/userApi.ts
import axios from "axios";

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

export const createUser = async (newUser: CreateUserRequest) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_SERVER_HOST}/api/user-create`,
      newUser
    );

    console.log('Status:', res.status);
    console.log('Response data:', res.data);
    console.log("[REGISTER] Firestore document created");

    return res.data; // important so your component can use it
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response) {
        console.error(
          'POST failed with status:',
          err.response.status,
          err.response.statusText
        );
      } else if (err.request) {
        console.error('Network error: no response from server');
      } else {
        console.error('Request setup error:', err.message);
      }
    } else {
      console.error('Unexpected error', err);
    }

    throw err; // VERY IMPORTANT (so caller knows it failed)
  }
};

export const fetchUser = async () => {
   try {
    const res = await axios.get(
      `${import.meta.env.VITE_SERVER_HOST}/api/user-create`
    );

    console.log('Status:', res.status);
    console.log('Response data:', res.data);
    console.log("[REGISTER] Firestore document created");

    return res.data; // important so your component can use it
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response) {
        console.error(
          'POST failed with status:',
          err.response.status,
          err.response.statusText
        );
      } else if (err.request) {
        console.error('Network error: no response from server');
      } else {
        console.error('Request setup error:', err.message);
      }
    } else {
      console.error('Unexpected error', err);
    }

    throw err; // VERY IMPORTANT (so caller knows it failed)
  }
}