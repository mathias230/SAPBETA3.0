"use client";

import React, { useState } from 'react';
import { useTournamentStore } from '@/lib/store';
import type { Group as GroupType, Team, Match as MatchType, Standing } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { LayoutGrid, PlusCircle, Trash2, Users, ListChecks, CalendarDays, RefreshCcw, Download, Edit3, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
  const [editingMatch, setEditingMatch] = useState<{groupId: string, match: MatchType, scoreA: string, scoreB: string} | null>(null);
  
  const { toast } = useToast();

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
      setSelectedTeamIdForGroupAdd(null); // Reset for next selection
    } else {
      toast({ title: "Error", description: "Please select a group and a team.", variant: "destructive" });
    }
  };

  const handleUpdateMatchScore = () => {
    if (editingMatch) {
      const scoreA = parseInt(editingMatch.scoreA);
      const scoreB = parseInt(editingMatch.scoreB);
      if (isNaN(scoreA) || isNaN(scoreB)) {
        toast({ title: "Error", description: "Scores must be numbers.", variant: "destructive" });
        return;
      }
      updateGroupMatchScore(editingMatch.groupId, editingMatch.match.id, scoreA, scoreB);
      toast({ title: "Match Updated", description: "Score has been recorded." });
      setEditingMatch(null);
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

        <div className="grid md:grid-cols-2 gap-6">
        {groups.map(group => (
          <Card key={group.id} id={`group-card-${group.id}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">{group.name}</CardTitle>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
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
            <CardContent className="space-y-4">
              {isAdmin && (
                <div className="space-y-2 p-3 border rounded-md bg-muted/20">
                  <h4 className="font-semibold">Add Team to {group.name}</h4>
                  <div className="flex space-x-2">
                    <Select onValueChange={setSelectedTeamIdForGroupAdd} value={selectedTeamIdForGroupAdd || ""}>
                      <SelectTrigger><SelectValue placeholder="Select team to add" /></SelectTrigger>
                      <SelectContent>
                        {availableTeamsForGroup(group.id).map(team => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                         {availableTeamsForGroup(group.id).length === 0 && <p className="p-2 text-sm text-muted-foreground">No available teams</p>}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => { setSelectedGroupIdForTeamAdd(group.id); handleAddTeamToSelectedGroup();}}>Add Team</Button>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-1 flex items-center"><Users className="mr-2 h-4 w-4" />Teams in {group.name} ({group.teamIds.length})</h4>
                {group.teamIds.length === 0 ? <p className="text-sm text-muted-foreground">No teams assigned.</p> : (
                  <ul className="list-disc list-inside pl-1 space-y-1 text-sm">
                    {group.teamIds.map(teamId => {
                      const team = getTeamById(teamId);
                      return (
                        <li key={teamId} className="flex justify-between items-center">
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
                <div>
                  <h4 className="font-semibold mb-1 flex items-center"><CalendarDays className="mr-2 h-4 w-4" />Matches</h4>
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    <ul className="space-y-2 text-sm">
                      {group.matches.map(match => {
                        const teamA = getTeamById(match.teamAId);
                        const teamB = getTeamById(match.teamBId);
                        return (
                          <li key={match.id} className="p-2 rounded-md bg-background hover:bg-muted/50">
                            <div className="flex justify-between items-center">
                              <span>{teamA?.name || 'TBA'} vs {teamB?.name || 'TBA'}</span>
                              {match.played ? (
                                <span className="font-semibold text-primary">{match.scoreA} - {match.scoreB}</span>
                              ) : <span className="text-xs text-muted-foreground">Pending</span>}
                            </div>
                            {isAdmin && !match.played && (
                               <Button size="xs" variant="outline" className="mt-1 w-full text-xs" onClick={() => setEditingMatch({groupId: group.id, match, scoreA: '', scoreB: ''})}>
                                <Edit3 className="mr-1 h-3 w-3"/>Set Score
                               </Button>
                            )}
                            {isAdmin && match.played && (
                               <Button size="xs" variant="outline" className="mt-1 w-full text-xs" onClick={() => setEditingMatch({groupId: group.id, match, scoreA: String(match.scoreA), scoreB: String(match.scoreB)})}>
                                <Edit3 className="mr-1 h-3 w-3"/>Edit Score
                               </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-stretch space-y-2">
               <Button onClick={() => setViewingStandingsGroupId(group.id)} className="w-full" variant="outline">
                 <ListChecks className="mr-2 h-4 w-4"/>View Standings
               </Button>
                <Button onClick={() => exportElementAsPNG(`group-standings-${group.id}`, `${group.name}-standings.png`)} className="w-full" variant="outline" disabled={getGroupStandings(group.id).length === 0}>
                  <Download className="mr-2 h-4 w-4" />Export Standings PNG
                </Button>
            </CardFooter>
          </Card>
        ))}
        </div>

        {/* View Standings Dialog */}
        <Dialog open={!!viewingStandingsGroupId} onOpenChange={(isOpen) => !isOpen && setViewingStandingsGroupId(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Standings: {groups.find(g => g.id === viewingStandingsGroupId)?.name}</DialogTitle>
              <DialogDescription>Points, GD, GF, GA calculated automatically.</DialogDescription>
            </DialogHeader>
            {viewingStandingsGroupId && (
              <div id={`group-standings-${viewingStandingsGroupId}`}>
                <StandingsTable standings={getGroupStandings(viewingStandingsGroupId)} getTeamName={(id) => getTeamById(id)?.name || 'N/A'} />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingStandingsGroupId(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Match Score Dialog */}
        <Dialog open={!!editingMatch} onOpenChange={(isOpen) => !isOpen && setEditingMatch(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Match Score</DialogTitle>
                    <DialogDescription>
                        {getTeamById(editingMatch?.match.teamAId || '')?.name} vs {getTeamById(editingMatch?.match.teamBId || '')?.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div>
                        <label htmlFor="scoreA" className="block text-sm font-medium text-muted-foreground">{getTeamById(editingMatch?.match.teamAId || '')?.name}</label>
                        <Input id="scoreA" type="number" value={editingMatch?.scoreA} onChange={(e) => setEditingMatch(prev => prev ? {...prev, scoreA: e.target.value} : null)} />
                    </div>
                    <div>
                        <label htmlFor="scoreB" className="block text-sm font-medium text-muted-foreground">{getTeamById(editingMatch?.match.teamBId || '')?.name}</label>
                        <Input id="scoreB" type="number" value={editingMatch?.scoreB} onChange={(e) => setEditingMatch(prev => prev ? {...prev, scoreB: e.target.value} : null)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingMatch(null)}>Cancel</Button>
                    <Button onClick={handleUpdateMatchScore}>Save Score</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
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
    <ScrollArea className="max-h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">#</TableHead>
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
              <TableCell>{s.rank || index + 1}</TableCell>
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
