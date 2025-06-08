

"use client";
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreState, Team, Group, League, KnockoutStage, Match, Standing, KnockoutRound, ClassificationZone, RandomGroupDistributionConfig, ArchivedWinner } from '@/types';
import { ADMIN_PASSWORD } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const initialState: Omit<StoreState, keyofReturnType<typeof tournamentActions>> = {
  teams: [],
  groups: [],
  league: null,
  knockoutStage: null,
  isAdmin: false,
  theme: 'system',
  selectedGroupIdsForExport: [],
  archivedWinners: [], // New
};

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

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
      selectedGroupIdsForExport: [],
      // archivedWinners: [] // Decided to keep history on reset, clear manually if needed or add specific action
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
        teamIds: group.teamIds.filter(teamId => teamId !== id),
        matches: group.matches.filter(match => match.teamAId !== id && match.teamBId !== id)
      })),
      league: state.league ? {
        ...state.league,
        teamIds: state.league.teamIds.filter(teamId => teamId !== id),
        matches: state.league.matches.filter(match => match.teamAId !== id && match.teamBId !== id)
      } : null,
      knockoutStage: state.knockoutStage ? {
        ...state.knockoutStage,
        teamIds: state.knockoutStage.teamIds.filter(teamId => teamId !== id),
        rounds: state.knockoutStage.rounds.map(round => ({
            ...round,
            matches: round.matches.map(match => {
                if (match.teamAId === id) return {...match, teamAId: 'TBD_DELETED'};
                if (match.teamBId === id) return {...match, teamBId: 'TBD_DELETED'};
                return match;
            }).filter(match => !(match.teamAId === 'TBD_DELETED' && match.teamBId === 'TBD_DELETED'))
        }))
      } : null,
      selectedGroupIdsForExport: state.selectedGroupIdsForExport.filter(groupId =>
        !state.groups.find(g => g.id === groupId && (g.teamIds.includes(id) || g.matches.some(m => m.teamAId === id || m.teamBId === id)))
      ),
      archivedWinners: state.archivedWinners.filter(aw => aw.championTeamId !== id) // Also remove from history if team is deleted
    }));
  },
  createGroup: (name: string, matchGenerationMode: 'automatic' | 'manual' = 'automatic', rounds: 1 | 2 = 1) => {
    if (!get().isAdmin) return "";
    const newGroup: Group = {
      id: uuidv4(),
      name,
      teamIds: [],
      matches: [],
      classificationZones: [],
      matchGenerationMode,
      rounds
    };
    set((state: StoreState) => ({ groups: [...state.groups, newGroup] }));
    return newGroup.id;
  },
  deleteGroup: (groupIdToDelete: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.filter(g => g.id !== groupIdToDelete),
      selectedGroupIdsForExport: state.selectedGroupIdsForExport.filter(id => id !== groupIdToDelete),
    }));
  },
  addTeamToGroup: (groupId: string, teamId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.map(g =>
        g.id === groupId && !g.teamIds.includes(teamId) ? { ...g, teamIds: [...g.teamIds, teamId] } : g
      )
    }));
    const group = get().groups.find((g: Group) => g.id === groupId);
    if (group && group.matchGenerationMode === 'automatic' && group.teamIds.length >=2) {
      get().generateGroupMatches(groupId);
    }
  },
  removeTeamFromGroup: (groupId: string, teamId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.map(g => {
        if (g.id === groupId) {
          const updatedTeamIds = g.teamIds.filter(id => id !== teamId);
          const updatedMatches = g.matches.filter(m => m.teamAId !== teamId && m.teamBId !== teamId);
          return { ...g, teamIds: updatedTeamIds, matches: updatedMatches };
        }
        return g;
      })
    }));
     const group = get().groups.find((g: Group) => g.id === groupId);
    if (group && group.matchGenerationMode === 'automatic' && group.teamIds.length >=2) {
      get().generateGroupMatches(groupId);
    } else if (group && group.matchGenerationMode === 'automatic' && group.teamIds.length < 2) {
        get().clearGroupMatches(groupId);
    }
  },
  distributeTeamsRandomlyToGroups: (config: RandomGroupDistributionConfig) => {
    if (!get().isAdmin) return;
    const { numGroups, teamsPerGroup, groupNamePrefix = "Grupo ", autoGenerateMatches = false, roundsPerGroupIfAutoGenerated = 1 } = config;
    let availableTeams = shuffleArray([...get().teams]);

    if (availableTeams.length === 0 || numGroups <= 0) return;

    const newGroups: Group[] = [];
    for (let i = 0; i < numGroups; i++) {
      newGroups.push({
        id: uuidv4(),
        name: `${groupNamePrefix}${String.fromCharCode(65 + i)}`,
        teamIds: [],
        matches: [],
        classificationZones: [],
        matchGenerationMode: 'automatic',
        rounds: roundsPerGroupIfAutoGenerated,
      });
    }

    let currentTeamIndex = 0;
    if (teamsPerGroup && teamsPerGroup > 0) {
      for (let i = 0; i < numGroups; i++) {
        const groupTeamCount = Math.min(teamsPerGroup, availableTeams.length - currentTeamIndex);
        for (let j = 0; j < groupTeamCount; j++) {
          if (currentTeamIndex < availableTeams.length) {
            newGroups[i].teamIds.push(availableTeams[currentTeamIndex].id);
            currentTeamIndex++;
          }
        }
      }
    } else {
      let groupIndex = 0;
      while (currentTeamIndex < availableTeams.length) {
        newGroups[groupIndex % numGroups].teamIds.push(availableTeams[currentTeamIndex].id);
        currentTeamIndex++;
        groupIndex++;
      }
    }

    const finalGroups = newGroups.filter(g => g.teamIds.length > 0);

    set({ groups: finalGroups, selectedGroupIdsForExport: [] }); // Reset selection

    if (autoGenerateMatches) {
      finalGroups.forEach(group => {
        if (group.teamIds.length >= 2) {
          get().generateGroupMatches(group.id);
        }
      });
    }
  },
  setGroupMatchGenerationMode: (groupId: string, mode: 'automatic' | 'manual') => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.map(g => {
        if (g.id === groupId) {
          return { ...g, matchGenerationMode: mode, matches: [] }; // Clear matches on mode change
        }
        return g;
      })
    }));
    if (mode === 'automatic') {
      const group = get().groups.find((g: Group) => g.id === groupId);
      if (group && group.teamIds.length >=2) get().generateGroupMatches(groupId);
    }
  },
  setGroupRounds: (groupId: string, rounds: 1 | 2) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.map(g =>
        g.id === groupId ? { ...g, rounds } : g
      )
    }));
    const group = get().groups.find((g: Group) => g.id === groupId);
    if (group && group.matchGenerationMode === 'automatic' && group.teamIds.length >=2) {
      get().generateGroupMatches(groupId); // Regenerate matches with new round config
    }
  },
  clearGroupMatches: (groupId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.map(g =>
        g.id === groupId ? { ...g, matches: [] } : g
      )
    }));
  },
  generateGroupMatches: (groupId: string) => {
    if (!get().isAdmin) return;
    const group = get().groups.find((g: Group) => g.id === groupId);

    if (!group || group.teamIds.length < 2 || group.matchGenerationMode === 'manual') {
      if (group && group.matchGenerationMode === 'manual') {
         // Matches are managed manually, do nothing here.
      } else if (group) {
         set((state: StoreState) => ({
          groups: state.groups.map(g => g.id === groupId ? { ...g, matches: [] } : g)
        }));
      }
      return;
    }

    let matches: Match[] = [];
    for (let i = 0; i < group.teamIds.length; i++) {
      for (let j = i + 1; j < group.teamIds.length; j++) {
        matches.push({
          id: uuidv4(),
          teamAId: group.teamIds[i],
          teamBId: group.teamIds[j],
          played: false,
        });
        if (group.rounds === 2) {
           matches.push({
            id: uuidv4(),
            teamAId: group.teamIds[j],
            teamBId: group.teamIds[i],
            played: false,
          });
        }
      }
    }

    set((state: StoreState) => ({
      groups: state.groups.map(g => g.id === groupId ? { ...g, matches: shuffleArray(matches) } : g)
    }));
  },
  addManualMatchToGroup: (groupId: string, teamAId: string, teamBId: string) => {
    if (!get().isAdmin) return;
    const group = get().groups.find((g: Group) => g.id === groupId);
    if (!group || group.matchGenerationMode === 'automatic' || teamAId === teamBId) return;
    if (!group.teamIds.includes(teamAId) || !group.teamIds.includes(teamBId)) return;

    const newMatch: Match = { id: uuidv4(), teamAId, teamBId, played: false };
    set((state: StoreState) => ({
      groups: state.groups.map(g =>
        g.id === groupId ? { ...g, matches: [...g.matches, newMatch] } : g
      )
    }));
  },
  removeManualMatchFromGroup: (groupId: string, matchId: string) => {
    if (!get().isAdmin) return;
     const group = get().groups.find((g: Group) => g.id === groupId);
    if (!group || group.matchGenerationMode === 'automatic') return;

    set((state: StoreState) => ({
      groups: state.groups.map(g =>
        g.id === groupId ? { ...g, matches: g.matches.filter(m => m.id !== matchId) } : g
      )
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
  addGroupClassificationZone: (groupId: string, zoneData: Omit<ClassificationZone, 'id'>) => {
    if (!get().isAdmin) return;
    const newZone: ClassificationZone = { ...zoneData, id: uuidv4() };
    set((state: StoreState) => ({
      groups: state.groups.map(g =>
        g.id === groupId ? { ...g, classificationZones: [...(g.classificationZones || []), newZone].sort((a,b) => a.rankMin - b.rankMin) } : g
      )
    }));
  },
  removeGroupClassificationZone: (groupId: string, zoneId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      groups: state.groups.map(g =>
        g.id === groupId ? { ...g, classificationZones: (g.classificationZones || []).filter(z => z.id !== zoneId) } : g
      )
    }));
  },
  setupLeague: (name: string, teamIds: string[], rounds: 1 | 2, matchGenerationMode: 'automatic' | 'manual' = 'automatic') => {
    if (!get().isAdmin) return;
    const newLeague: League = {
      id: uuidv4(),
      name,
      teamIds,
      matches: [],
      settings: { rounds },
      classificationZones: [],
      matchGenerationMode
    };
    set({ league: newLeague });
    if (matchGenerationMode === 'automatic') {
      get().generateLeagueMatches();
    }
  },
  deleteLeague: () => {
    if (!get().isAdmin) return;
    set({ league: null });
  },
  generateLeagueMatches: () => {
    if (!get().isAdmin) return;
    const league = get().league;
    if (!league || league.teamIds.length < 2 || league.matchGenerationMode === 'manual') {
        if (league && league.matchGenerationMode === 'manual') {
            // Matches are managed manually.
        } else if (league) {
            set((state: StoreState) => ({
                league: state.league ? { ...state.league, matches: [] } : null
            }));
        }
        return;
    }

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
            teamAId: league.teamIds[j],
            teamBId: league.teamIds[i],
            played: false,
          });
        }
      }
    }
    set((state: StoreState) => ({
      league: state.league ? { ...state.league, matches: shuffleArray(matches) } : null
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
  addLeagueClassificationZone: (zoneData: Omit<ClassificationZone, 'id'>) => {
    if (!get().isAdmin || !get().league) return;
    const newZone: ClassificationZone = { ...zoneData, id: uuidv4() };
    set((state: StoreState) => ({
      league: state.league ? { ...state.league, classificationZones: [...(state.league.classificationZones || []), newZone].sort((a,b) => a.rankMin - b.rankMin) } : null
    }));
  },
  removeLeagueClassificationZone: (zoneId: string) => {
    if (!get().isAdmin || !get().league) return;
    set((state: StoreState) => ({
      league: state.league ? { ...state.league, classificationZones: (state.league.classificationZones || []).filter(z => z.id !== zoneId) } : null
    }));
  },
  setLeagueMatchGenerationMode: (mode: 'automatic' | 'manual') => {
    if (!get().isAdmin || !get().league) return;
    set((state: StoreState) => ({
      league: state.league ? { ...state.league, matchGenerationMode: mode, matches: [] } : null // Clear matches
    }));
    if (mode === 'automatic' && get().league && get().league.teamIds.length >= 2) {
      get().generateLeagueMatches();
    }
  },
  addManualMatchToLeague: (teamAId: string, teamBId: string) => {
    if (!get().isAdmin || !get().league) return;
    const league = get().league;
    if (league.matchGenerationMode === 'automatic' || teamAId === teamBId) return;
    if (!league.teamIds.includes(teamAId) || !league.teamIds.includes(teamBId)) return;

    const newMatch: Match = { id: uuidv4(), teamAId, teamBId, played: false };
    set((state: StoreState) => ({
      league: state.league ? { ...state.league, matches: [...state.league.matches, newMatch] } : null
    }));
  },
  removeManualMatchFromLeague: (matchId: string) => {
    if (!get().isAdmin || !get().league) return;
    const league = get().league;
    if (league.matchGenerationMode === 'automatic') return;

    set((state: StoreState) => ({
      league: state.league ? { ...state.league, matches: league.matches.filter(m => m.id !== matchId) } : null
    }));
  },
  clearLeagueMatches: () => {
    if (!get().isAdmin || !get().league) return;
    set((state: StoreState) => ({
      league: state.league ? { ...state.league, matches: [] } : null
    }));
  },
  setLeagueRounds: (rounds: 1 | 2) => {
    if (!get().isAdmin || !get().league) return;
    set((state: StoreState) => ({
      league: state.league ? { ...state.league, settings: { ...state.league.settings, rounds } } : null
    }));
    const league = get().league;
    if (league && league.matchGenerationMode === 'automatic' && league.teamIds.length >= 2) {
      get().generateLeagueMatches();
    }
  },
  setupKnockoutStage: (name: string, numTeams: number, teamIdsInOrder: string[]) => {
    if (!get().isAdmin || teamIdsInOrder.length !== numTeams || (numTeams & (numTeams - 1)) !== 0 || numTeams < 2) return;

    const getRoundName = (teamsInRound: number): string => {
      if (teamsInRound === 2) return "Final";
      if (teamsInRound === 4) return "Semifinales";
      if (teamsInRound === 8) return "Cuartos de Final";
      if (teamsInRound === 16) return "Octavos de Final";
      return `Ronda de ${teamsInRound}`;
    };

    const initialRoundName = getRoundName(numTeams);
    const initialMatches: Match[] = [];
    for(let i = 0; i < teamIdsInOrder.length / 2; i++) {
        initialMatches.push({
            id: uuidv4(),
            teamAId: teamIdsInOrder[i*2],
            teamBId: teamIdsInOrder[i*2+1],
            played: false,
            roundName: initialRoundName
        })
    }
    const initialRound: KnockoutRound = {id: uuidv4(), name: initialRoundName, matches: initialMatches};
    const newKnockoutStage: KnockoutStage = { id: uuidv4(), name, numTeams, teamIds: teamIdsInOrder, rounds: [initialRound] };
    set({ knockoutStage: newKnockoutStage });
  },
  deleteKnockoutStage: () => {
    if(!get().isAdmin) return;
    set({ knockoutStage: null });
  },
  updateKnockoutMatchTeams: (roundId: string, matchId: string, newTeamAId: string, newTeamBId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => {
      if (!state.knockoutStage) return {};
      const round = state.knockoutStage.rounds.find(r => r.id === roundId);
      if (!round) return {};
      const match = round.matches.find(m => m.id === matchId);
      if (!match || match.played) return {}; // Cannot change teams if match played or not found

      return {
        knockoutStage: {
          ...state.knockoutStage,
          rounds: state.knockoutStage.rounds.map(r =>
            r.id === roundId
              ? {
                  ...r,
                  matches: r.matches.map(m =>
                    m.id === matchId ? { ...m, teamAId: newTeamAId, teamBId: newTeamBId } : m
                  ),
                }
              : r
          ),
        },
      };
    });
  },
  updateKnockoutMatchScore: (roundId: string, matchId: string, scoreA: number, scoreB: number) => {
    if (!get().isAdmin || scoreA === scoreB) return;

    let winnerId: string | undefined;
    let currentStage = get().knockoutStage;
    if(!currentStage) return;

    const matchToUpdate = currentStage.rounds.find(r => r.id === roundId)?.matches.find(m => m.id === matchId);
    if(!matchToUpdate) return;
    winnerId = scoreA > scoreB ? matchToUpdate.teamAId : matchToUpdate.teamBId;
    if(winnerId === 'TBD' || winnerId === 'TBD_DELETED') return;

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

      const currentRoundIndex = updatedRounds.findIndex(r => r.id === roundId);
      const currentRound = updatedRounds[currentRoundIndex];
      let newKnockoutStage = { ...state.knockoutStage, rounds: updatedRounds };

      if (currentRound && currentRound.matches.every(m => m.played)) {
        const winners = currentRound.matches.map(m => (m.scoreA! > m.scoreB!) ? m.teamAId : m.teamBId).filter(id => id && id !== 'TBD' && id !== 'TBD_DELETED') as string[];

        if (winners.length === 1 && currentRound.matches.length === 1) {
          newKnockoutStage.championId = winners[0];
        } else if (winners.length > 1 && (currentRoundIndex === updatedRounds.length -1 || updatedRounds[currentRoundIndex+1]?.matches.length !== winners.length / 2 )) {

          const nextRoundWinners = shuffleArray(winners);
          const numTeamsNextRound = nextRoundWinners.length;
           const getRoundName = (teamsInRound: number): string => {
            if (teamsInRound === 2) return "Final";
            if (teamsInRound === 4) return "Semifinales";
            if (teamsInRound === 8) return "Cuartos de Final";
            if (teamsInRound === 16) return "Octavos de Final";
            return `Ronda de ${teamsInRound}`;
          };
          const nextRoundName = getRoundName(numTeamsNextRound);
          const nextRoundMatches: Match[] = [];
          for (let i = 0; i < nextRoundWinners.length; i += 2) {
            nextRoundMatches.push({
                id: uuidv4(),
                teamAId: nextRoundWinners[i],
                teamBId: nextRoundWinners[i+1] ? nextRoundWinners[i+1] : 'TBD',
                played: false,
                roundName: nextRoundName
            });
          }
          if(nextRoundMatches.length > 0){
             const nextRound: KnockoutRound = { id: uuidv4(), name: nextRoundName, matches: nextRoundMatches };
             if(updatedRounds[currentRoundIndex+1]) {
                // If next round already exists (e.g. from a previous score update that was then changed)
                // replace it if it's structure is different, otherwise just update teams.
                // For simplicity, we'll just replace.
                // This could be more sophisticated to preserve manual team edits in later rounds if scores change.
                const newRoundsList = [...updatedRounds.slice(0, currentRoundIndex + 1), nextRound];
                newKnockoutStage.rounds = newRoundsList;
             } else {
                newKnockoutStage.rounds = [...updatedRounds, nextRound];
             }
          }
        } else if (winners.length > 1 && updatedRounds[currentRoundIndex+1]?.matches.length === winners.length / 2) {
           // Next round already exists and has correct number of matches, update its teams
            const nextRound = updatedRounds[currentRoundIndex+1];
            const newNextRoundMatches: Match[] = [];
            const availableWinners = shuffleArray(winners);
            for (let i = 0; i < nextRound.matches.length; i++) {
                newNextRoundMatches.push({
                    ...nextRound.matches[i],
                    teamAId: availableWinners[i*2] || 'TBD',
                    teamBId: availableWinners[i*2+1] || 'TBD',
                    played: false, // Reset played status for next round matches
                    scoreA: undefined,
                    scoreB: undefined
                });
            }
            updatedRounds[currentRoundIndex+1] = { ...nextRound, matches: newNextRoundMatches };
            newKnockoutStage.rounds = [...updatedRounds]; // Ensure all subsequent rounds are also cleared/reset
             if (newKnockoutStage.rounds.length > currentRoundIndex + 2) {
                newKnockoutStage.rounds = newKnockoutStage.rounds.slice(0, currentRoundIndex + 2);
             }
             newKnockoutStage.championId = undefined; // Clear champion if scores are changed mid-tournament
        }
      }
      return { knockoutStage: newKnockoutStage };
    });
  },
  getTeamById: (teamId: string) => {
    if (teamId === 'TBD') return { id: 'TBD', name: 'A Definir' };
    if (teamId === 'TBD_DELETED') return { id: 'TBD_DELETED', name: 'Equipo Eliminado' };
    return get().teams.find((team: Team) => team.id === teamId);
  },
  getGroupStandings: (groupId: string) => {
    const group = get().groups.find((g: Group) => g.id === groupId);
    const teams = get().teams;
    if (!group) return [];

    const standingsMap: Record<string, Standing> = {};
    group.teamIds.forEach(teamId => {
      const team = get().getTeamById(teamId);
      if (team) {
        standingsMap[teamId] = {
          teamId,
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
        };
      }
    });

    group.matches.forEach(match => {
      if (match.played && match.scoreA !== undefined && match.scoreB !== undefined) {
        const teamAStanding = standingsMap[match.teamAId];
        const teamBStanding = standingsMap[match.teamBId];

        if (!teamAStanding || !teamBStanding) return;

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
      const teamAInfo = teams.find((t:Team) => t.id === a.teamId);
      const teamBInfo = teams.find((t:Team) => t.id === b.teamId);
      const teamAName = teamAInfo?.name || '';
      const teamBName = teamBInfo?.name || '';
      return teamAName.localeCompare(teamBName);
    }).map((s, index) => {
      const rank = index + 1;
      let zoneColorClass: string | undefined = undefined;
      let classificationZoneName: string | undefined = undefined;
      const currentGroup = get().groups.find((g: Group) => g.id === groupId);
      if (currentGroup && currentGroup.classificationZones) {
        for (const zone of currentGroup.classificationZones.sort((za,zb) => za.rankMin - zb.rankMin)) {
          if (rank >= zone.rankMin && rank <= zone.rankMax) {
            zoneColorClass = zone.colorClass;
            classificationZoneName = zone.name;
            break;
          }
        }
      }
      return { ...s, rank, zoneColorClass, classificationZoneName };
    });
  },
  getLeagueStandings: () => {
    const league = get().league;
    const teams = get().teams;
    if (!league) return [];

    const standingsMap: Record<string, Standing> = {};
    league.teamIds.forEach(teamId => {
       const team = get().getTeamById(teamId);
       if (team) {
        standingsMap[teamId] = {
          teamId,
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
        };
      }
    });

    league.matches.forEach(match => {
      if (match.played && match.scoreA !== undefined && match.scoreB !== undefined) {
        const teamAStanding = standingsMap[match.teamAId];
        const teamBStanding = standingsMap[match.teamBId];

        if (!teamAStanding || !teamBStanding) return;

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
      const teamAInfo = teams.find((t:Team) => t.id === a.teamId);
      const teamBInfo = teams.find((t:Team) => t.id === b.teamId);
      const teamAName = teamAInfo?.name || '';
      const teamBName = teamBInfo?.name || '';
      return teamAName.localeCompare(teamBName);
    }).map((s, index) => {
      const rank = index + 1;
      let zoneColorClass: string | undefined = undefined;
      let classificationZoneName: string | undefined = undefined;
      const currentLeague = get().league;
      if (currentLeague && currentLeague.classificationZones) {
        for (const zone of currentLeague.classificationZones.sort((za,zb) => za.rankMin - zb.rankMin)) {
          if (rank >= zone.rankMin && rank <= zone.rankMax) {
            zoneColorClass = zone.colorClass;
            classificationZoneName = zone.name;
            break;
          }
        }
      }
      return { ...s, rank, zoneColorClass, classificationZoneName };
    });
  },
  // Export Selection
  toggleSelectGroupForExport: (groupId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => {
      const selectedGroupIdsForExport = state.selectedGroupIdsForExport.includes(groupId)
        ? state.selectedGroupIdsForExport.filter(id => id !== groupId)
        : [...state.selectedGroupIdsForExport, groupId];
      return { selectedGroupIdsForExport };
    });
  },
  clearSelectedGroupsForExport: () => {
    if (!get().isAdmin) return;
    set({ selectedGroupIdsForExport: [] });
  },

  // Archived Winners
  addArchivedWinner: (winnerData: { tournamentName: string; championTeamId: string; type: 'Liga' | 'Eliminatoria' }) => {
    if (!get().isAdmin) return;
    const championTeam = get().getTeamById(winnerData.championTeamId);
    if (!championTeam) return;

    const newArchivedWinner: ArchivedWinner = {
      id: uuidv4(),
      tournamentName: winnerData.tournamentName,
      championTeamId: winnerData.championTeamId,
      championTeamName: championTeam.name,
      dateArchived: new Date().toISOString(),
      type: winnerData.type,
    };
    set((state: StoreState) => ({
      archivedWinners: [...state.archivedWinners, newArchivedWinner].sort((a,b) => new Date(a.dateArchived).getTime() - new Date(b.dateArchived).getTime()),
    }));
  },
  deleteArchivedWinner: (winnerId: string) => {
    if (!get().isAdmin) return;
    set((state: StoreState) => ({
      archivedWinners: state.archivedWinners.filter(aw => aw.id !== winnerId),
    }));
  },
  getArchivedWinners: () => {
    return get().archivedWinners.sort((a,b) => new Date(a.dateArchived).getTime() - new Date(b.dateArchived).getTime());
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
      onRehydrateStorage: (_state) => {
        return (hydratedState, error) => {
          if (error) {
            // console.log('An error occurred during hydration', error);
          } else {
            if (hydratedState) {
              if (typeof hydratedState.selectedGroupIdsForExport === 'undefined') {
                hydratedState.selectedGroupIdsForExport = [];
              }
              if (hydratedState.groups) {
                hydratedState.groups.forEach(group => {
                  if (!Array.isArray(group.classificationZones)) {
                    group.classificationZones = [];
                  }
                  if (typeof group.matchGenerationMode === 'undefined') {
                    group.matchGenerationMode = 'automatic';
                  }
                  if (typeof group.rounds === 'undefined') {
                    group.rounds = 1;
                  }
                });
              }
              if (hydratedState.league) {
                if (!Array.isArray(hydratedState.league.classificationZones)) {
                  hydratedState.league.classificationZones = [];
                }
                if (typeof hydratedState.league.matchGenerationMode === 'undefined') {
                  hydratedState.league.matchGenerationMode = 'automatic';
                }
              }
              if (typeof hydratedState.archivedWinners === 'undefined') {
                 hydratedState.archivedWinners = [];
              } else {
                // Ensure dateArchived is a string for sorting and display
                hydratedState.archivedWinners = hydratedState.archivedWinners.map((aw: ArchivedWinner) => ({
                    ...aw,
                    dateArchived: typeof aw.dateArchived === 'string' ? aw.dateArchived : new Date(aw.dateArchived).toISOString(),
                })).sort((a: ArchivedWinner, b: ArchivedWinner) => new Date(a.dateArchived).getTime() - new Date(b.dateArchived).getTime());
              }
            }
          }
        };
      },
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).ZustandStore = useTournamentStore;
}
