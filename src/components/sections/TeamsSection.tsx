
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

  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);


  const handleAddTeam = () => {
    if (newTeamName.trim() === '') {
      toast({ title: "Error", description: "El nombre del equipo no puede estar vacío.", variant: "destructive" });
      return;
    }
    addTeam(newTeamName.trim());
    toast({ title: "Equipo Añadido", description: `El equipo "${newTeamName.trim()}" ha sido añadido.` });
    setNewTeamName('');
  };

  const handleEditTeam = () => {
    if (editingTeam && editingTeamName.trim() !== '') {
      editTeam(editingTeam.id, editingTeamName.trim());
      toast({ title: "Equipo Actualizado", description: `Nombre del equipo cambiado a "${editingTeamName.trim()}".` });
      setEditingTeam(null);
      setEditingTeamName('');
    } else if (editingTeamName.trim() === '') {
       toast({ title: "Error", description: "El nombre del equipo no puede estar vacío.", variant: "destructive" });
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    const team = getTeamById(teamId);
    deleteTeam(teamId);
    toast({ title: "Equipo Eliminado", description: `El equipo "${team?.name || 'Equipo'}" ha sido eliminado.` });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <Users className="mr-2 h-6 w-6 text-primary" /> Gestionar Equipos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAdmin && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold mb-2">Añadir Nuevo Equipo</h3>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Ingresar nombre del equipo"
                className="flex-grow"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
              />
              <Button onClick={handleAddTeam} className="bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Equipo
              </Button>
            </div>
          </div>
        )}

        {editingTeam && isAdmin && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold mb-2">Editar Equipo: {getTeamById(editingTeam.id)?.name}</h3>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={editingTeamName}
                onChange={(e) => setEditingTeamName(e.target.value)}
                placeholder="Ingresar nuevo nombre del equipo"
                className="flex-grow"
                 onKeyPress={(e) => e.key === 'Enter' && handleEditTeam()}
              />
              <Button onClick={handleEditTeam} variant="secondary">Guardar Cambios</Button>
              <Button onClick={() => setEditingTeam(null)} variant="outline">Cancelar</Button>
            </div>
          </div>
        )}

        {localTeams.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Aún no se han añadido equipos.</p>
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
                      aria-label={`Editar ${team.name}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Eliminar ${team.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar Equipo: {team.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esto eliminará el equipo del torneo y de cualquier grupo o liga asociado. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTeam(team.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar Equipo
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
        {localTeams.length} equipo{localTeams.length === 1 ? '' : 's'} en el torneo.
      </CardFooter>
    </Card>
  );
}
