export interface User { // this is ther user object and stores all of the detials about ther user
userID: string;
  name: string;
  avatarUrl: string;
   role: string,
  stats: {
    wins: number;
    losses: number;
  };
  createdAt: Date | null;
  // Add any other custom fields here, e.g. role, stats
};