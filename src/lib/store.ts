"use client";
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreState, Team, Group, League, KnockoutStage, Match, Standing, KnockoutRound } from '@/types';
import { ADMIN_PASSWORD } from '@/types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const initialState: Omit<StoreState, keyofReturnType<typeof tournamentActions>> = {
  teams: [],
  groups: [],
  league: null,
  knockoutStage: null,
  isAdmin: false,
  theme: 'system',
};

const tournamentActions = (set: any, get: any): Omit<StoreState, keyof typeof initialState> => ({
  login: (password: string) => {
    if (password === ADMIN_PASSWORD) {
      set({ isAdmin: true });
      return true;
    }
    return false;
  },
  logout: () => set({ isAdmin: false }),
  resetTournament: () => {
    if (!get().isAdmin) return;
    set({
      teams: [],
      groups: [],
      league: null,
      knockoutStage: null,
    });
  },
  setTheme: (theme) => set({ theme }),
  addTeam: (name: string) => {
    if (!get().isAdmin) return;
    const newTeam: Team = { id: uuidv4(), name };
    set((state: StoreState) => ({ teams: [...state.teams, newTeam] }));
  },
  editTeam: (id: string, newName: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      teams: state.teams.map((team) =>
        team.id === id ? { ...team, name: newName } : team
      ),
    }));
  },
  deleteTeam: (id: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      teams: state.teams.filter((team) => team.id !== id),
      groups: state.groups.map(group => ({
        ...group,
        teamIds: group.teamIds.filter(teamId => teamId !== id)
      })),
      league: state.league ? {
        ...state.league,
        teamIds: state.league.teamIds.filter(teamId => teamId !== id)
      } : null,
      // Add similar logic for knockout stage if teams are directly referenced by id
    }));
  },
  createGroup: (name: string) => {
    if (!get().isAdmin) return "";
    const newGroup: Group = { id: uuidv4(), name, teamIds: [], matches: [] };
    set((state: StoreState) => ({ groups: [...state.groups, newGroup] }));
    return newGroup.id;
  },
  deleteGroup: (groupId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.filter(g => g.id !== groupId)
    }));
  },
  addTeamToGroup: (groupId: string, teamId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.map(g => 
        g.id === groupId && !g.teamIds.includes(teamId) ? { ...g, teamIds: [...g.teamIds, teamId] } : g
      )
    }));
  },
  removeTeamFromGroup: (groupId: string, teamId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.map(g => 
        g.id === groupId ? { ...g, teamIds: g.teamIds.filter(id => id !== teamId) } : g
      )
    }));
  },
  generateGroupMatches: (groupId: string) => {
    if (!get().isAdmin) return;
    const group = get().groups.find((g: Group) => g.id === groupId);
    if (!group || group.teamIds.length < 2) return;

    const matches: Match[] = [];
    for (let i = 0; i < group.teamIds.length; i++) {
      for (let j = i + 1; j < group.teamIds.length; j++) {
        matches.push({
          id: uuidv4(),
          teamAId: group.teamIds[i],
          teamBId: group.teamIds[j],
          played: false,
        });
      }
    }
    // Shuffle matches
    for (let i = matches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }
    set((state: StoreState) => ({
      groups: state.groups.map(g => g.id === groupId ? { ...g, matches } : g)
    }));
  },
  updateGroupMatchScore: (groupId: string, matchId: string, scoreA: number, scoreB: number) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            matches: g.matches.map(m => 
              m.id === matchId ? { ...m, scoreA, scoreB, played: true } : m
            )
          };
        }
        return g;
      })
    }));
  },
  setGroupClassificationZone: () => { /* Placeholder */ },
  setupLeague: (name: string, teamIds: string[], rounds: 1 | 2) => {
    if (!get().isAdmin) return;
    const newLeague: League = { id: uuidv4(), name, teamIds, matches: [], settings: { rounds } };
    set({ league: newLeague });
    get().generateLeagueMatches();
  },
  deleteLeague: () => {
    if (!get().isAdmin) return;
    set({ league: null });
  },
  generateLeagueMatches: () => {
    if (!get().isAdmin) return;
    const league = get().league;
    if (!league || league.teamIds.length < 2) return;

    let matches: Match[] = [];
    for (let i = 0; i < league.teamIds.length; i++) {
      for (let j = i + 1; j < league.teamIds.length; j++) {
        matches.push({
          id: uuidv4(),
          teamAId: league.teamIds[i],
          teamBId: league.teamIds[j],
          played: false,
        });
        if (league.settings.rounds === 2) {
          matches.push({
            id: uuidv4(),
            teamAId: league.teamIds[j], // Swap for return leg
            teamBId: league.teamIds[i],
            played: false,
          });
        }
      }
    }
     // Shuffle matches
    for (let i = matches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }
    set((state: StoreState) => ({
      league: state.league ? { ...state.league, matches } : null
    }));
  },
  updateLeagueMatchScore: (matchId: string, scoreA: number, scoreB: number) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      league: state.league ? {
        ...state.league,
        matches: state.league.matches.map(m =>
          m.id === matchId ? { ...m, scoreA, scoreB, played: true } : m
        )
      } : null
    }));
  },
  setLeagueClassificationZone: () => { /* Placeholder */ },
  setupKnockoutStage: (name: string, numTeams: number, teamIds: string[]) => {
    if (!get().isAdmin) return;
    // Basic setup, actual bracket generation is complex
    const initialRoundName = numTeams === 2 ? "Final" : numTeams === 4 ? "Semi Finals" : numTeams === 8 ? "Quarter Finals" : `Round of ${numTeams}`;
    const initialMatches: Match[] = [];
    for(let i = 0; i < teamIds.length / 2; i++) {
        initialMatches.push({
            id: uuidv4(),
            teamAId: teamIds[i*2],
            teamBId: teamIds[i*2+1],
            played: false,
            roundName: initialRoundName
        })
    }
    const initialRound: KnockoutRound = {id: uuidv4(), name: initialRoundName, matches: initialMatches};
    const newKnockoutStage: KnockoutStage = { id: uuidv4(), name, numTeams, teamIds, rounds: [initialRound] };
    set({ knockoutStage: newKnockoutStage });
  },
  deleteKnockoutStage: () => {
    if(!get().isAdmin) return;
    set({ knockoutStage: null });
  },
  updateKnockoutMatchScore: (roundId: string, matchId: string, scoreA: number, scoreB: number) => {
    if (!get().isAdmin || scoreA === scoreB) return; // No draws in knockout
    const winnerId = scoreA > scoreB ? get().knockoutStage?.rounds.find(r => r.id === roundId)?.matches.find(m => m.id === matchId)?.teamAId : get().knockoutStage?.rounds.find(r => r.id === roundId)?.matches.find(m => m.id === matchId)?.teamBId;

    set((state: StoreState) => {
      if (!state.knockoutStage) return {};
      
      const updatedRounds = state.knockoutStage.rounds.map(round => {
        if (round.id === roundId) {
          return {
            ...round,
            matches: round.matches.map(match => 
              match.id === matchId ? { ...match, scoreA, scoreB, played: true } : match
            )
          };
        }
        return round;
      });

      // Auto-advance logic (simplified)
      // This needs to be more robust: check if all matches in a round are played, then create next round.
      const currentRoundIndex = updatedRounds.findIndex(r => r.id === roundId);
      const currentRound = updatedRounds[currentRoundIndex];
      let newKnockoutStage = { ...state.knockoutStage, rounds: updatedRounds };

      if (currentRound && currentRound.matches.every(m => m.played)) {
        const winners = currentRound.matches.map(m => (m.scoreA! > m.scoreB!) ? m.teamAId : m.teamBId);
        if (winners.length === 1) { // Champion
          newKnockoutStage.championId = winners[0];
        } else if (winners.length > 1 && currentRoundIndex === updatedRounds.length -1) { // Not yet final round but all played
          const nextRoundName = winners.length === 2 ? "Final" : `Round of ${winners.length}`;
          const nextRoundMatches: Match[] = [];
          for (let i = 0; i < winners.length; i += 2) {
            if (winners[i+1]) { // Ensure pairs
                 nextRoundMatches.push({
                    id: uuidv4(),
                    teamAId: winners[i],
                    teamBId: winners[i+1],
                    played: false,
                    roundName: nextRoundName
                });
            }
          }
          if(nextRoundMatches.length > 0){
             const nextRound: KnockoutRound = { id: uuidv4(), name: nextRoundName, matches: nextRoundMatches };
             newKnockoutStage.rounds = [...updatedRounds, nextRound];
          }
        }
      }
      return { knockoutStage: newKnockoutStage };
    });
  },
  getTeamById: (teamId: string) => {
    return get().teams.find((team: Team) => team.id === teamId);
  },
  getGroupStandings: (groupId: string) => {
    const group = get().groups.find((g: Group) => g.id === groupId);
    const teams = get().teams;
    if (!group) return [];

    const standingsMap: Record<string, Standing> = {};
    group.teamIds.forEach(teamId => {
      standingsMap[teamId] = {
        teamId,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
      };
    });

    group.matches.forEach(match => {
      if (match.played && match.scoreA !== undefined && match.scoreB !== undefined) {
        const teamAStanding = standingsMap[match.teamAId];
        const teamBStanding = standingsMap[match.teamBId];

        teamAStanding.played++;
        teamBStanding.played++;
        teamAStanding.goalsFor += match.scoreA;
        teamAStanding.goalsAgainst += match.scoreB;
        teamBStanding.goalsFor += match.scoreB;
        teamBStanding.goalsAgainst += match.scoreA;

        if (match.scoreA > match.scoreB) {
          teamAStanding.won++;
          teamAStanding.points += 3;
          teamBStanding.lost++;
        } else if (match.scoreA < match.scoreB) {
          teamBStanding.won++;
          teamBStanding.points += 3;
          teamAStanding.lost++;
        } else {
          teamAStanding.drawn++;
          teamBStanding.drawn++;
          teamAStanding.points += 1;
          teamBStanding.points += 1;
        }
      }
    });
    
    return Object.values(standingsMap).map(s => ({
      ...s,
      goalDifference: s.goalsFor - s.goalsAgainst
    })).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      const teamA = teams.find((t:Team) => t.id === a.teamId)?.name || '';
      const teamB = teams.find((t:Team) => t.id === b.teamId)?.name || '';
      return teamA.localeCompare(teamB);
    }).map((s, index) => ({ ...s, rank: index + 1 }));
  },
  getLeagueStandings: () => {
    const league = get().league;
    const teams = get().teams;
    if (!league) return [];

    const standingsMap: Record<string, Standing> = {};
    league.teamIds.forEach(teamId => {
      standingsMap[teamId] = {
        teamId,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
      };
    });
    
    league.matches.forEach(match => {
      if (match.played && match.scoreA !== undefined && match.scoreB !== undefined) {
        const teamAStanding = standingsMap[match.teamAId];
        const teamBStanding = standingsMap[match.teamBId];

        teamAStanding.played++;
        teamBStanding.played++;
        teamAStanding.goalsFor += match.scoreA;
        teamAStanding.goalsAgainst += match.scoreB;
        teamBStanding.goalsFor += match.scoreB;
        teamBStanding.goalsAgainst += match.scoreA;

        if (match.scoreA > match.scoreB) {
          teamAStanding.won++;
          teamAStanding.points += 3;
          teamBStanding.lost++;
        } else if (match.scoreA < match.scoreB) {
          teamBStanding.won++;
          teamBStanding.points += 3;
          teamAStanding.lost++;
        } else {
          teamAStanding.drawn++;
          teamBStanding.drawn++;
          teamAStanding.points += 1;
          teamBStanding.points += 1;
        }
      }
    });
     return Object.values(standingsMap).map(s => ({
      ...s,
      goalDifference: s.goalsFor - s.goalsAgainst
    })).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      const teamA = teams.find((t:Team) => t.id === a.teamId)?.name || '';
      const teamB = teams.find((t:Team) => t.id === b.teamId)?.name || '';
      return teamA.localeCompare(teamB);
    }).map((s, index) => ({ ...s, rank: index + 1 }));
  },
});

export const useTournamentStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...tournamentActions(set, get),
    }),
    {
      name: 'tournament-storage', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);

// UUID is not available in browser by default, so we need a simple polyfill or use a library.
// For this scaffold, I'll use the 'uuid' library. Make sure it's installed: npm install uuid @types/uuid
// If not using a library, a simple ID generator could be:
// const simpleId = () => Math.random().toString(36).substring(2, 15);
// However, uuidv4 is more robust for uniqueness.
