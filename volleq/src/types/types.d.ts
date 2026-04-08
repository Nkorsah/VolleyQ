export interface User { // this is ther user object and stores all of the detials about ther user
userID: string;
  name: string;
  email: string;
  avatarUrl: string;
   role: string,
  stats: {
    wins: number;
    losses: number;
  };
  createdAt: Date | null;
  // Add any other custom fields here, e.g. role, stats
};

// export interface User {
//   userID: string;
//   name: string;
//   email: string;
//   avatarUrl: string;
//   host: boolean; // role changes the frontend pages
//   team_leader: boolean; // role changes the frontend pages
//   team_name:string;
//   locationID: string;
//   location_name: string;

//   current_teamID: string;

//   stats: {
//     wins: number;
//     losses: number;
//   };

//   createdAt: Date | null;
// }