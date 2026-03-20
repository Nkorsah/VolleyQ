import { User } from "firebase/auth";

export type AppUser = User & {
  name: string;
  avatarUrl: string;
  // Add any other custom fields here, e.g. role, stats
};