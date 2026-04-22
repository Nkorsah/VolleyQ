// export interface User { // this is ther user object and stores all of the detials about ther user
// userID: string;
//   name: string;
//   email: string;
//   avatarUrl: string;
//    role: string,
//   stats: {
//     wins: number;
//     losses: number;
//   };
//   createdAt: Date | null;
//   // Add any other custom fields here, e.g. role, stats
// };

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type User = {
  userID: string;
  name: string;
  email: string;
  avatarUrl: string;
  teamID?: string;
  host?: boolean; // role changes the frontend pages
  team_leader?: boolean; // role changes the frontend pages
  team_name?:string;
  locationID?: string;
  location_name?: string;
  skill_level?: SkillLevel;

  current_teamID?: string;

  stats: {
    wins: number;
    losses: number;
    games_played: number;
  };

  createdAt: Date | null;
}
export type TeamMember = {
  userID: string;
  name: string;
  avatarUrl: string;
  team_leader: boolean;
};

export type Team = {
  teamID: string;
  team_name: string;
  owner_id: string;
  difficulty_rating: number;
  queue_time: string;

  members: TeamMember[];

  team_settings: {
    team_color: string;
    number_of_players: number;
    private: boolean;
  };

  team_stats: {
    wins: number;
    losses: number;
  };

  createdAt: any;
  venueID: string;
};