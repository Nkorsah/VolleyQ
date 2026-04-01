export interface User { // this is ther user object and stores all of the detials about ther user
  name: string;
  avatarUrl: string;
   role: string,
  stats: {
    wins: number;
    losses: number;
  };
  // Add any other custom fields here, e.g. role, stats
};