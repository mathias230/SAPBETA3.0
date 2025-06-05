"use client";

import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '@/lib/store';
import type { Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit3, Trash2, Users } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";

export default function TeamsSection() {
  const { teams, addTeam, editTeam, deleteTeam, isAdmin, getTeamById } = useTournamentStore();
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const { toast } = useToast();

  // Effect to ensure component re-renders if `teams` from store changes.
  // This can be helpful if other parts of the app modify `teams`.
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);


  const handleAddTeam = () => {
    if (newTeamName.trim() === '') {
      toast({ title: "Error", description: "Team name cannot be empty.", variant: "destructive" });
      return;
    }
    addTeam(newTeamName.trim());
    setNewTeamName('');
    toast({ title: "Team Added", description: `${newTeamName.trim()} has been added.` });
  };

  const handleEditTeam = () => {
    if (editingTeam && editingTeamName.trim() !== '') {
      editTeam(editingTeam.id, editingTeamName.trim());
      toast({ title: "Team Updated", description: `Team name changed to ${editingTeamName.trim()}.` });
      setEditingTeam(null);
      setEditingTeamName('');
    } else if (editingTeamName.trim() === '') {
       toast({ title: "Error", description: "Team name cannot be empty.", variant: "destructive" });
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    const team = getTeamById(teamId);
    deleteTeam(teamId);
    toast({ title: "Team Deleted", description: `${team?.name || 'Team'} has been removed.` });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <Users className="mr-2 h-6 w-6 text-primary" /> Manage Teams
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAdmin && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold mb-2">Add New Team</h3>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                className="flex-grow"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
              />
              <Button onClick={handleAddTeam} className="bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Team
              </Button>
            </div>
          </div>
        )}

        {editingTeam && isAdmin && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold mb-2">Edit Team: {getTeamById(editingTeam.id)?.name}</h3>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={editingTeamName}
                onChange={(e) => setEditingTeamName(e.target.value)}
                placeholder="Enter new team name"
                className="flex-grow"
                 onKeyPress={(e) => e.key === 'Enter' && handleEditTeam()}
              />
              <Button onClick={handleEditTeam} variant="secondary">Save Changes</Button>
              <Button onClick={() => setEditingTeam(null)} variant="outline">Cancel</Button>
            </div>
          </div>
        )}

        {localTeams.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No teams have been added yet.</p>
        ) : (
          <ul className="space-y-3">
            {localTeams.map((team) => (
              <li key={team.id} className="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm hover:shadow-md transition-shadow">
                <span className="font-medium">{team.name}</span>
                {isAdmin && (
                  <div className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingTeam(team);
                        setEditingTeamName(team.name);
                      }}
                      aria-label={`Edit ${team.name}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${team.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Team: {team.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the team from the tournament and any associated groups or leagues. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTeam(team.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Team
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {localTeams.length} team{localTeams.length === 1 ? '' : 's'} in the tournament.
      </CardFooter>
    </Card>
  );
}
