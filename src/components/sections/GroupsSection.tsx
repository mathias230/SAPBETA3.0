
"use client";

import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '@/lib/store';
import type { Group as GroupType, Team, Match as MatchType, Standing } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { LayoutGrid, PlusCircle, Trash2, Users, ListChecks, RefreshCcw, Download, Save, ListOrdered, Palette } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { exportElementAsPNG } from '@/lib/export';

export default function GroupsSection() {
  const { 
    groups, teams, isAdmin, createGroup, deleteGroup, addTeamToGroup, removeTeamFromGroup, 
    generateGroupMatches, updateGroupMatchScore, getTeamById, getGroupStandings 
  } = useTournamentStore();
  
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupIdForTeamAdd, setSelectedGroupIdForTeamAdd] = useState<string | null>(null);
  const [selectedTeamIdForGroupAdd, setSelectedTeamIdForGroupAdd] = useState<string | null>(null);
  const [viewingStandingsGroupId, setViewingStandingsGroupId] = useState<string | null>(null);
  
  // State to hold input scores for each match
  const [matchScoresInput, setMatchScoresInput] = useState<Record<string, { scoreA: string, scoreB: string }>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    // Initialize or update matchScoresInput when groups data changes
    const newFormState: Record<string, { scoreA: string, scoreB: string }> = {};
    groups.forEach(group => {
      group.matches.forEach(match => {
        newFormState[match.id] = {
          scoreA: match.played && match.scoreA !== undefined ? String(match.scoreA) : '',
          scoreB: match.played && match.scoreB !== undefined ? String(match.scoreB) : '',
        };
      });
    });
    setMatchScoresInput(prevScores => {
      // Merge, allowing existing user inputs for unplayed matches to persist if they were typing
      const mergedState = {...newFormState};
      Object.keys(prevScores).forEach(matchId => {
        const groupMatch = groups.flatMap(g => g.matches).find(m => m.id === matchId);
        if (groupMatch && !groupMatch.played && (prevScores[matchId].scoreA !== '' || prevScores[matchId].scoreB !== '')) {
           // If match is unplayed and prevScores has some user input, keep it.
          mergedState[matchId] = prevScores[matchId];
        } else if (!groupMatch) {
           // If match was deleted, remove from local state
           delete mergedState[matchId];
        }
      });
      return mergedState;
    });
  }, [groups]);

  const handleMatchScoreInputChange = (matchId: string, team: 'A' | 'B', value: string) => {
    setMatchScoresInput(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { scoreA: '', scoreB: '' }),
        [team === 'A' ? 'scoreA' : 'scoreB']: value,
      }
    }));
  };

  const handleSaveMatchScore = (groupId: string, matchId: string) => {
    const scores = matchScoresInput[matchId];
    if (scores && scores.scoreA.trim() !== '' && scores.scoreB.trim() !== '') {
      const scoreA = parseInt(scores.scoreA);
      const scoreB = parseInt(scores.scoreB);
      if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
        toast({ title: "Error", description: "Scores must be valid non-negative numbers.", variant: "destructive" });
        return;
      }
      updateGroupMatchScore(groupId, matchId, scoreA, scoreB);
      toast({ title: "Match Updated", description: "Score has been recorded." });
    } else {
      toast({ title: "Error", description: "Please enter both scores.", variant: "destructive" });
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({ title: "Error", description: "Group name cannot be empty.", variant: "destructive" });
      return;
    }
    const newId = createGroup(newGroupName.trim());
    toast({ title: "Group Created", description: `Group "${newGroupName.trim()}" has been created.` });
    setNewGroupName('');
  };
  
  const handleAddTeamToSelectedGroup = () => {
    if (selectedGroupIdForTeamAdd && selectedTeamIdForGroupAdd) {
      addTeamToGroup(selectedGroupIdForTeamAdd, selectedTeamIdForGroupAdd);
      const group = groups.find(g => g.id === selectedGroupIdForTeamAdd);
      const team = getTeamById(selectedTeamIdForGroupAdd);
      toast({ title: "Team Added to Group", description: `Team "${team?.name}" added to group "${group?.name}".` });
      setSelectedTeamIdForGroupAdd(null); 
    } else {
      toast({ title: "Error", description: "Please select a group and a team.", variant: "destructive" });
    }
  };
  
  const availableTeamsForGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return teams;
    return teams.filter(team => !group.teamIds.includes(team.id));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <LayoutGrid className="mr-2 h-6 w-6 text-primary" /> Group Stage Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAdmin && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Create New Group</CardTitle></CardHeader>
            <CardContent className="flex space-x-2">
              <Input 
                placeholder="Group Name (e.g., Group A)" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
              <Button onClick={handleCreateGroup}><PlusCircle className="mr-2 h-4 w-4" />Create Group</Button>
            </CardContent>
          </Card>
        )}

        {groups.length === 0 && <p className="text-muted-foreground text-center py-4">No groups created yet.</p>}

        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map(group => (
          <Card key={group.id} id={`group-card-${group.id}`} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">{group.name}</CardTitle>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />Eliminar Grupo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Group: {group.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the group and all its associated data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { deleteGroup(group.id); toast({ title: "Group Deleted" }); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Group
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              {isAdmin && (
                <div className="space-y-2 p-3 border rounded-md bg-muted/20">
                  <h4 className="font-semibold flex items-center"><Users className="mr-2 h-4 w-4 text-primary" />Equipos en el Grupo</h4>
                  <div className="flex space-x-2">
                    <Select onValueChange={setSelectedTeamIdForGroupAdd} value={selectedTeamIdForGroupAdd || ""}>
                      <SelectTrigger><SelectValue placeholder="Selecciona equipo para añadir" /></SelectTrigger>
                      <SelectContent>
                        {availableTeamsForGroup(group.id).map(team => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                         {availableTeamsForGroup(group.id).length === 0 && <p className="p-2 text-sm text-muted-foreground">No available teams</p>}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => { setSelectedGroupIdForTeamAdd(group.id); handleAddTeamToSelectedGroup();}}>Añadir Equipo</Button>
                  </div>
                </div>
              )}
              
              <div>
                 <h4 className="font-semibold mb-1 flex items-center"><Users className="mr-2 h-4 w-4" />Teams in {group.name} ({group.teamIds.length})</h4>
                {group.teamIds.length === 0 ? <p className="text-sm text-muted-foreground">No teams assigned.</p> : (
                  <ul className="space-y-1 text-sm border rounded-md p-2">
                    {group.teamIds.map(teamId => {
                      const team = getTeamById(teamId);
                      return (
                        <li key={teamId} className="flex justify-between items-center p-1.5 bg-background rounded hover:bg-muted/30">
                          {team?.name || 'Unknown Team'}
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { removeTeamFromGroup(group.id, teamId); toast({title: "Team Removed"}); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {isAdmin && group.teamIds.length >= 2 && group.matches.length === 0 && (
                <Button onClick={() => { generateGroupMatches(group.id); toast({ title: "Matches Generated" }); }} className="w-full" variant="secondary">
                  <RefreshCcw className="mr-2 h-4 w-4"/>Generate Matches
                </Button>
              )}
              
              {group.matches.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold flex items-center"><ListOrdered className="mr-2 h-4 w-4 text-primary" />Partidos (Orden Aleatorio)</h4>
                    {isAdmin && (
                      <Button onClick={() => { generateGroupMatches(group.id); toast({ title: "Matches Re-generated" }); }} className="w-auto" variant="outline" size="sm">
                        <RefreshCcw className="mr-2 h-3 w-3"/>Re-generar Partidos
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[250px] border rounded-md p-0"> {/* Adjusted height and padding */}
                    <ul className="space-y-0"> {/* Removed space-y-2 for tighter packing */}
                      {group.matches.map((match, matchIndex) => {
                        const teamA = getTeamById(match.teamAId);
                        const teamB = getTeamById(match.teamBId);
                        return (
                          <li key={match.id} className={`p-3 ${matchIndex < group.matches.length - 1 ? 'border-b' : ''} bg-card hover:bg-muted/30`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{teamA?.name || 'TBA'} vs {teamB?.name || 'TBA'}</span>
                              {!isAdmin && match.played && (
                                <span className="font-semibold text-primary text-sm">{match.scoreA} - {match.scoreB}</span>
                              )}
                              {!isAdmin && !match.played && (
                                <span className="text-xs text-muted-foreground">Pending</span>
                              )}
                            </div>
                            {isAdmin && (
                              <div className="mt-1 flex items-center space-x-2">
                                <Input
                                  type="number"
                                  placeholder="Res. 1"
                                  value={matchScoresInput[match.id]?.scoreA ?? ''}
                                  onChange={(e) => handleMatchScoreInputChange(match.id, 'A', e.target.value)}
                                  className="w-20 h-8 text-sm"
                                  min="0"
                                />
                                <span>-</span>
                                <Input
                                  type="number"
                                  placeholder="Res. 2"
                                  value={matchScoresInput[match.id]?.scoreB ?? ''}
                                  onChange={(e) => handleMatchScoreInputChange(match.id, 'B', e.target.value)}
                                  className="w-20 h-8 text-sm"
                                  min="0"
                                />
                                <Button size="sm" className="h-8 text-xs px-3" onClick={() => handleSaveMatchScore(group.id, match.id)}>
                                  <Save className="mr-1 h-3 w-3" /> Guardar
                                </Button>
                                {match.played && (
                                   <span className="text-xs font-semibold text-primary ml-auto">({match.scoreA} - {match.scoreB})</span>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-stretch space-y-2 mt-auto pt-4"> {/* Added mt-auto and pt-4 */}
               <Button onClick={() => setViewingStandingsGroupId(group.id)} className="w-full" variant="outline">
                 <ListChecks className="mr-2 h-4 w-4"/>View Standings
               </Button>
               {isAdmin && (
                <Button variant="outline" className="w-full" disabled>
                  <Palette className="mr-2 h-4 w-4" /> Define Classification Zones (Soon)
                </Button>
               )}
                <Button onClick={() => exportElementAsPNG(`group-standings-${group.id}`, `${group.name}-standings.png`)} className="w-full" variant="outline" disabled={getGroupStandings(group.id).length === 0}>
                  <Download className="mr-2 h-4 w-4" />Export Standings PNG
                </Button>
            </CardFooter>
          </Card>
        ))}
        </div>

        <Dialog open={!!viewingStandingsGroupId} onOpenChange={(isOpen) => !isOpen && setViewingStandingsGroupId(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Standings: {groups.find(g => g.id === viewingStandingsGroupId)?.name}</DialogTitle>
              <DialogDescription>Points, GD, GF, GA calculated automatically.</DialogDescription>
            </DialogHeader>
            {viewingStandingsGroupId && (
              <div id={`group-standings-${viewingStandingsGroupId}`} className="p-1 bg-card rounded-md">
                <StandingsTable standings={getGroupStandings(viewingStandingsGroupId)} getTeamName={(id) => getTeamById(id)?.name || 'N/A'} />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingStandingsGroupId(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground border-t pt-4">
        {groups.length} group{groups.length === 1 ? '' : 's'} configured. Define classification zones (e.g., promotion, relegation) with distinct colors in standings.
      </CardFooter>
    </Card>
  );
}


interface StandingsTableProps {
  standings: Standing[];
  getTeamName: (teamId: string) => string;
}

function StandingsTable({ standings, getTeamName }: StandingsTableProps) {
  if (standings.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No matches played or standings to display.</p>;
  }
  return (
    <ScrollArea className="max-h-[400px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] text-center">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">GF</TableHead>
            <TableHead className="text-center">GA</TableHead>
            <TableHead className="text-center">GD</TableHead>
            <TableHead className="text-center">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((s, index) => (
            <TableRow key={s.teamId} className={s.zoneColor ? s.zoneColor : ''}>
              <TableCell className="text-center font-medium">{(s.rank || index + 1)}.</TableCell>
              <TableCell className="font-medium">{getTeamName(s.teamId)}</TableCell>
              <TableCell className="text-center">{s.played}</TableCell>
              <TableCell className="text-center">{s.won}</TableCell>
              <TableCell className="text-center">{s.drawn}</TableCell>
              <TableCell className="text-center">{s.lost}</TableCell>
              <TableCell className="text-center">{s.goalsFor}</TableCell>
              <TableCell className="text-center">{s.goalsAgainst}</TableCell>
              <TableCell className="text-center">{s.goalDifference}</TableCell>
              <TableCell className="text-center font-semibold">{s.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}


    