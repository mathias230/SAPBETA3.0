
export interface Team {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  teamAId: string;
  teamBId: string;
  scoreA?: number;
  scoreB?: number;
  roundName?: string; 
  played: boolean;
}

export interface ClassificationZone {
  id: string;
  name: string;
  rankMin: number;
  rankMax: number;
  colorClass: string; // Tailwind CSS class, e.g., "bg-green-200 dark:bg-green-800/60"
}

export interface Standing {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank?: number;
  classificationZoneName?: string; // Name of the zone, e.g., "Promotion"
  zoneColorClass?: string; // Tailwind CSS class for background color
}

export interface Group {
  id: string;
  name: string;
  teamIds: string[];
  matches: Match[];
  classificationZones: ClassificationZone[];
}

export interface League {
  id: string;
  name: string;
  teamIds: string[];
  matches: Match[];
  settings: {
    rounds: 1 | 2; 
  };
  // classificationZones for league can be added similarly if needed
}

export interface KnockoutRound {
  id: string;
  name: string; 
  matches: Match[];
}

export interface KnockoutStage {
  id: string;
  name: string;
  numTeams: number;
  teamIds: string[]; 
  rounds: KnockoutRound[];
  championId?: string;
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface TournamentDataState {
  teams: Team[];
  groups: Group[];
  league: League | null;
  knockoutStage: KnockoutStage | null;
  isAdmin: boolean;
  theme: AppTheme;
}

export interface TournamentActions {
  // Admin
  login: (password: string) => boolean;
  logout: () => void;
  resetTournament: () => void;

  // Theme
  setTheme: (theme: AppTheme) => void;

  // Teams
  addTeam: (name: string) => void;
  editTeam: (id: string, newName: string) => void;
  deleteTeam: (id: string) => void;
  
  // Groups
  createGroup: (name: string) => string; // returns group ID
  deleteGroup: (groupId: string) => void;
  addTeamToGroup: (groupId: string, teamId: string) => void;
  removeTeamFromGroup: (groupId: string, teamId: string) => void;
  generateGroupMatches: (groupId: string) => void;
  updateGroupMatchScore: (groupId: string, matchId: string, scoreA: number, scoreB: number) => void;
  addGroupClassificationZone: (groupId: string, zone: Omit<ClassificationZone, 'id'>) => void;
  removeGroupClassificationZone: (groupId: string, zoneId: string) => void;

  // League
  setupLeague: (name: string, teamIds: string[], rounds: 1 | 2) => void;
  deleteLeague: () => void;
  generateLeagueMatches: () => void;
  updateLeagueMatchScore: (matchId: string, scoreA: number, scoreB: number) => void;
  setLeagueClassificationZone: (rank: number, zone: string, color: string) => void; // Placeholder

  // Knockout
  setupKnockoutStage: (name: string, numTeams: number, teamIds: string[]) => void;
  deleteKnockoutStage: () => void;
  updateKnockoutMatchScore: (roundId: string, matchId: string, scoreA: number, scoreB: number) => void; // advances winner
  
  // Utility
  getTeamById: (teamId: string) => Team | undefined;
  getGroupStandings: (groupId: string) => Standing[];
  getLeagueStandings: () => Standing[];
}

export type StoreState = TournamentDataState & TournamentActions;

// Constants
export const ADMIN_PASSWORD = "123";
