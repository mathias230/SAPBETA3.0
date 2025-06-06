
"use client";

import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '@/lib/store';
import type { Group as GroupType, Team, Match as MatchType, Standing, ClassificationZone } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { LayoutGrid, PlusCircle, Trash2, Users, ListChecks, RefreshCcw, Download, Save, ListOrdered, Palette, Settings, X, Camera } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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

export const classificationColorOptions = [
  { label: "Verde (ej: Ascenso)", value: "bg-green-500/70 dark:bg-green-700/40" },
  { label: "Azul (ej: Repechaje)", value: "bg-blue-500/70 dark:bg-blue-700/40" },
  { label: "Amarillo (ej: Advertencia)", value: "bg-yellow-500/70 dark:bg-yellow-700/40" },
  { label: "Rojo (ej: Descenso)", value: "bg-red-500/70 dark:bg-red-700/40" },
  { label: "Púrpura (ej: Especial)", value: "bg-purple-500/70 dark:bg-purple-700/40" },
  { label: "Gris (ej: Neutral)", value: "bg-gray-400/70 dark:bg-gray-600/40" },
];

interface StandingsTableProps {
  standings: Standing[];
  getTeamName: (teamId: string) => string;
  classificationZones: ClassificationZone[];
}

export function StandingsTable({ standings, getTeamName, classificationZones }: StandingsTableProps) {
  if (standings.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No hay partidos jugados o clasificaciones para mostrar.</p>;
  }
  
  const activeZones = classificationZones.filter(zone => 
    standings.some(s => s.rank !== undefined && s.rank >= zone.rankMin && s.rank <= zone.rankMax)
  );

  return (
    <>
      <ScrollArea className="max-h-[60vh] rounded-md border">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-20 px-2 py-3">#</TableHead>
              <TableHead className="px-3 py-3">Equipo</TableHead>
              <TableHead className="text-center w-12 px-1 py-3">PJ</TableHead>
              <TableHead className="text-center w-12 px-1 py-3">G</TableHead>
              <TableHead className="text-center w-12 px-1 py-3">E</TableHead>
              <TableHead className="text-center w-12 px-1 py-3">P</TableHead>
              <TableHead className="text-center w-12 px-1 py-3">GF</TableHead>
              <TableHead className="text-center w-12 px-1 py-3">GC</TableHead>
              <TableHead className="text-center w-12 px-1 py-3">DG</TableHead>
              <TableHead className="text-center w-12 px-1 py-3">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((s, index) => (
              <TableRow key={s.teamId}>
                <TableCell className="font-medium text-left relative px-2 py-3">
                  {s.zoneColorClass && (
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.zoneColorClass.split(' ')[0]}`}
                      title={s.classificationZoneName || 'Zona de Clasificación'}
                    ></div>
                  )}
                  <span className="ml-3"> 
                    {(s.rank || index + 1)}.
                  </span>
                </TableCell>
                <TableCell className="font-medium px-3 py-3">{getTeamName(s.teamId)}</TableCell>
                <TableCell className="text-center px-1 py-3">{s.played}</TableCell>
                <TableCell className="text-center px-1 py-3">{s.won}</TableCell>
                <TableCell className="text-center px-1 py-3">{s.drawn}</TableCell>
                <TableCell className="text-center px-1 py-3">{s.lost}</TableCell>
                <TableCell className="text-center px-1 py-3">{s.goalsFor}</TableCell>
                <TableCell className="text-center px-1 py-3">{s.goalsAgainst}</TableCell>
                <TableCell className="text-center px-1 py-3">{s.goalDifference}</TableCell>
                <TableCell className="text-center font-semibold px-1 py-3">{s.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      {activeZones.length > 0 && (
        <div className="mt-4 p-3 border rounded-md space-y-1 text-xs text-muted-foreground">
          <h4 className="font-semibold text-sm text-foreground mb-1.5">Leyenda de Zonas:</h4>
          {activeZones.map(zone => (
            <div key={zone.id} className="flex items-center py-0.5">
              <span className={`w-3 h-3 rounded-sm mr-2 border border-foreground/20 ${zone.colorClass.split(' ')[0]}`}></span>
              <span>{zone.name} (Puestos {zone.rankMin}-{zone.rankMax})</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}


export default function GroupsSection() {
  const { 
    groups, teams, isAdmin, createGroup, deleteGroup, addTeamToGroup, removeTeamFromGroup, 
    generateGroupMatches, updateGroupMatchScore, getTeamById, getGroupStandings,
    addGroupClassificationZone, removeGroupClassificationZone
  } = useTournamentStore();
  
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupIdForTeamAdd, setSelectedGroupIdForTeamAdd] = useState<string | null>(null);
  const [selectedTeamIdForGroupAdd, setSelectedTeamIdForGroupAdd] = useState<string | null>(null);
  const [viewingStandingsGroupId, setViewingStandingsGroupId] = useState<string | null>(null);
  const [matchScoresInput, setMatchScoresInput] = useState<Record<string, { scoreA: string, scoreB: string }>>({});
  
  const [isDefineZoneModalOpen, setIsDefineZoneModalOpen] = useState(false);
  const [selectedGroupForZones, setSelectedGroupForZones] = useState<GroupType | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneMinRank, setNewZoneMinRank] = useState('');
  const [newZoneMaxRank, setNewZoneMaxRank] = useState('');
  const [newZoneColorClass, setNewZoneColorClass] = useState(classificationColorOptions[0].value);
  
  const { toast } = useToast();

  useEffect(() => {
    const newFormState: Record<string, { scoreA: string, scoreB: string }> = {};
    groups.forEach(group => {
      (group.matches || []).forEach(match => {
        newFormState[match.id] = {
          scoreA: match.played && match.scoreA !== undefined ? String(match.scoreA) : '',
          scoreB: match.played && match.scoreB !== undefined ? String(match.scoreB) : '',
        };
      });
    });
    setMatchScoresInput(prevScores => {
      const mergedState = {...newFormState};
      Object.keys(prevScores).forEach(matchId => {
        const groupMatch = groups.flatMap(g => g.matches || []).find(m => m.id === matchId);
        if (groupMatch && !groupMatch.played && (prevScores[matchId].scoreA !== '' || prevScores[matchId].scoreB !== '')) {
          mergedState[matchId] = prevScores[matchId];
        } else if (!groupMatch) {
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
        toast({ title: "Error", description: "Los marcadores deben ser números válidos no negativos.", variant: "destructive" });
        return;
      }
      updateGroupMatchScore(groupId, matchId, scoreA, scoreB);
      toast({ title: "Partido Actualizado", description: "El marcador ha sido registrado." });
    } else {
      toast({ title: "Error", description: "Por favor, ingresa ambos marcadores.", variant: "destructive" });
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({ title: "Error", description: "El nombre del grupo no puede estar vacío.", variant: "destructive" });
      return;
    }
    createGroup(newGroupName.trim());
    toast({ title: "Grupo Creado", description: `El grupo "${newGroupName.trim()}" ha sido creado.` });
    setNewGroupName('');
  };
  
  const handleAddTeamToSelectedGroup = () => {
    if (selectedGroupIdForTeamAdd && selectedTeamIdForGroupAdd) {
      addTeamToGroup(selectedGroupIdForTeamAdd, selectedTeamIdForGroupAdd);
      const group = groups.find(g => g.id === selectedGroupIdForTeamAdd);
      const team = getTeamById(selectedTeamIdForGroupAdd);
      toast({ title: "Equipo Añadido al Grupo", description: `El equipo "${team?.name}" fue añadido al grupo "${group?.name}".` });
      setSelectedTeamIdForGroupAdd(null); 
    } else {
      toast({ title: "Error", description: "Por favor, selecciona un grupo y un equipo.", variant: "destructive" });
    }
  };
  
  const availableTeamsForGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return teams;
    return teams.filter(team => !(group.teamIds || []).includes(team.id));
  };

  const openManageZonesModal = (group: GroupType) => {
    setSelectedGroupForZones(group);
    setIsDefineZoneModalOpen(true);
    setNewZoneName('');
    setNewZoneMinRank('');
    setNewZoneMaxRank('');
    setNewZoneColorClass(classificationColorOptions[0].value);
  };

  const handleAddClassificationZone = () => {
    if (!selectedGroupForZones) return;
    const rankMin = parseInt(newZoneMinRank);
    const rankMax = parseInt(newZoneMaxRank);

    if (!newZoneName.trim()) {
      toast({ title: "Error", description: "El nombre de la zona no puede estar vacío.", variant: "destructive" }); return;
    }
    if (isNaN(rankMin) || rankMin <= 0) {
      toast({ title: "Error", description: "El Puesto Mín. debe ser un número positivo.", variant: "destructive" }); return;
    }
    if (isNaN(rankMax) || rankMax <= 0) {
      toast({ title: "Error", description: "El Puesto Máx. debe ser un número positivo.", variant: "destructive" }); return;
    }
    if (rankMin > rankMax) {
      toast({ title: "Error", description: "El Puesto Mín. no puede ser mayor que el Puesto Máx.", variant: "destructive" }); return;
    }
     if ((selectedGroupForZones.classificationZones || []).some(zone => 
        (rankMin >= zone.rankMin && rankMin <= zone.rankMax) || 
        (rankMax >= zone.rankMin && rankMax <= zone.rankMax) ||
        (zone.rankMin >= rankMin && zone.rankMin <= rankMax) ||
        (zone.rankMax >= rankMin && zone.rankMax <= rankMax)
     )) {
        toast({ title: "Error", description: "El rango de puestos se superpone con una zona existente.", variant: "destructive" }); return;
     }

    addGroupClassificationZone(selectedGroupForZones.id, {
      name: newZoneName.trim(),
      rankMin,
      rankMax,
      colorClass: newZoneColorClass,
    });
    toast({ title: "Zona de Clasificación Añadida", description: `La zona "${newZoneName.trim()}" ha sido creada.` });
    setNewZoneName('');
    setNewZoneMinRank('');
    setNewZoneMaxRank('');
    setNewZoneColorClass(classificationColorOptions[0].value);
    const updatedGroup = useTournamentStore.getState().groups.find(g => g.id === selectedGroupForZones.id);
    if (updatedGroup) setSelectedGroupForZones(updatedGroup);
  };

  const handleRemoveClassificationZone = (groupId: string, zoneId: string) => {
    removeGroupClassificationZone(groupId, zoneId);
    toast({ title: "Zona de Clasificación Eliminada" });
    const updatedGroup = useTournamentStore.getState().groups.find(g => g.id === groupId);
    if (updatedGroup && selectedGroupForZones && selectedGroupForZones.id === groupId) {
       setSelectedGroupForZones(updatedGroup);
    }
  };

  const viewingGroup = groups.find(g => g.id === viewingStandingsGroupId);
  const viewingGroupStandings = viewingStandingsGroupId ? getGroupStandings(viewingStandingsGroupId) : [];
  const viewingGroupClassificationZones = viewingGroup?.classificationZones || [];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <LayoutGrid className="mr-2 h-6 w-6 text-primary" /> Gestión de Fase de Grupos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAdmin && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Crear Nuevo Grupo</CardTitle></CardHeader>
            <CardContent className="flex space-x-2">
              <Input 
                placeholder="Nombre del Grupo (ej: Grupo A)" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
              <Button onClick={handleCreateGroup}><PlusCircle className="mr-2 h-4 w-4" />Crear Grupo</Button>
            </CardContent>
          </Card>
        )}

        {groups.length === 0 && <p className="text-muted-foreground text-center py-4">Aún no se han creado grupos.</p>}

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
                      <AlertDialogTitle>¿Eliminar Grupo: {group.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto eliminará el grupo y todos sus datos asociados. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { deleteGroup(group.id); toast({ title: "Grupo Eliminado" }); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Eliminar Grupo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              {isAdmin && (
                <div className="space-y-2 p-3 border rounded-md bg-muted/20">
                  <h4 className="font-semibold flex items-center"><Users className="mr-2 h-4 w-4 text-primary" />Añadir Equipos al Grupo</h4>
                  <div className="flex space-x-2">
                    <Select onValueChange={setSelectedTeamIdForGroupAdd} value={selectedTeamIdForGroupAdd || ""}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar equipo para añadir" /></SelectTrigger>
                      <SelectContent>
                        {availableTeamsForGroup(group.id).map(team => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                         {availableTeamsForGroup(group.id).length === 0 && <SelectItem value="no-teams" disabled>No hay equipos disponibles</SelectItem>}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => { setSelectedGroupIdForTeamAdd(group.id); handleAddTeamToSelectedGroup();}}>Añadir Equipo</Button>
                  </div>
                </div>
              )}
              
              <div>
                 <h4 className="font-semibold mb-1 flex items-center"><Users className="mr-2 h-4 w-4" />Equipos en {group.name} ({(group.teamIds || []).length})</h4>
                {(group.teamIds || []).length === 0 ? <p className="text-sm text-muted-foreground">No hay equipos asignados.</p> : (
                  <ul className="space-y-1 text-sm border rounded-md p-2">
                    {(group.teamIds || []).map(teamId => {
                      const team = getTeamById(teamId);
                      return (
                        <li key={teamId} className="flex justify-between items-center p-1.5 bg-background rounded hover:bg-muted/30">
                          {team?.name || 'Equipo Desconocido'}
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { removeTeamFromGroup(group.id, teamId); toast({title: "Equipo Eliminado del Grupo"}); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {isAdmin && (group.teamIds || []).length >= 2 && (group.matches || []).length === 0 && (
                <Button onClick={() => { generateGroupMatches(group.id); toast({ title: "Partidos Generados" }); }} className="w-full" variant="secondary">
                  <RefreshCcw className="mr-2 h-4 w-4"/>Generar Partidos
                </Button>
              )}
              
              {(group.matches || []).length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold flex items-center"><ListOrdered className="mr-2 h-4 w-4 text-primary" />Partidos (Orden Aleatorio)</h4>
                    {isAdmin && (
                      <Button onClick={() => { generateGroupMatches(group.id); toast({ title: "Partidos Re-generados" }); }} className="w-auto" variant="outline" size="sm">
                        <RefreshCcw className="mr-2 h-3 w-3"/>Re-generar Partidos
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[250px] border rounded-md p-0">
                    <ul className="space-y-0">
                      {(group.matches || []).map((match, matchIndex) => {
                        const teamA = getTeamById(match.teamAId);
                        const teamB = getTeamById(match.teamBId);
                        return (
                          <li key={match.id} className={`p-3 ${(group.matches || []).length > 0 && matchIndex < (group.matches || []).length - 1 ? 'border-b' : ''} bg-card hover:bg-muted/30`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{teamA?.name || 'TBA'} vs {teamB?.name || 'TBA'}</span>
                              {!isAdmin && match.played && (
                                <span className="font-semibold text-primary text-sm">{match.scoreA} - {match.scoreB}</span>
                              )}
                              {!isAdmin && !match.played && (
                                <span className="text-xs text-muted-foreground">Pendiente</span>
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
            <CardFooter className="flex-col items-stretch space-y-2 mt-auto pt-4">
               <Button onClick={() => setViewingStandingsGroupId(group.id)} className="w-full" variant="outline">
                 <ListChecks className="mr-2 h-4 w-4"/>Ver Clasificación
               </Button>
            </CardFooter>
          </Card>
        ))}
        </div>

        <Dialog open={!!viewingStandingsGroupId} onOpenChange={(isOpen) => !isOpen && setViewingStandingsGroupId(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader className="flex flex-row justify-between items-start pr-6 pb-4 border-b mb-4">
                <div>
                    <DialogTitle className="flex items-center text-xl mb-1">
                        <ListChecks className="mr-2 h-5 w-5 text-primary" />
                        Clasificación: {viewingGroup?.name}
                    </DialogTitle>
                    <DialogDescription>Tabla de posiciones y zonas del grupo.</DialogDescription>
                </div>
              <Button variant="ghost" size="icon" onClick={() => toast({title: "Funcionalidad no implementada", description: "Tomar foto individual aún no está disponible."})}>
                <Camera className="h-5 w-5" />
                <span className="sr-only">Tomar Foto</span>
              </Button>
            </DialogHeader>
            {viewingStandingsGroupId && (
              <div className="space-y-6 py-2">
                <div id={`group-standings-${viewingStandingsGroupId}`} className="bg-card rounded-md">
                  <StandingsTable 
                    standings={viewingGroupStandings} 
                    getTeamName={(id) => getTeamById(id)?.name || 'N/A'}
                    classificationZones={viewingGroupClassificationZones}
                  />
                </div>
                
                <Card className="mt-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
                    <CardTitle className="text-lg flex items-center">
                      <Palette className="mr-2 h-5 w-5 text-primary" />
                      Zonas de Clasificación de {viewingGroup?.name}
                    </CardTitle>
                    {isAdmin && viewingGroup && (
                      <Button size="sm" variant="outline" onClick={() => openManageZonesModal(viewingGroup)}>
                        <Settings className="mr-2 h-4 w-4" />Añadir/Gestionar Zona
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {(viewingGroupClassificationZones || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No se han configurado zonas de clasificación para este grupo.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(viewingGroupClassificationZones || []).map(zone => (
                          <li key={zone.id} className="flex items-center text-sm p-2 border rounded-md">
                            <span className={`w-4 h-4 rounded-sm mr-3 border border-foreground/20 ${zone.colorClass.split(' ')[0]}`}></span>
                            <span>{zone.name} (Puestos {zone.rankMin}-{zone.rankMax})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter className="sm:justify-between mt-4 pt-4 border-t">
              <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
              {viewingStandingsGroupId && (
                <Button 
                  onClick={() => {
                    const groupName = viewingGroup ? viewingGroup.name.replace(/\s+/g, '_') : 'Grupo'; 
                    exportElementAsPNG(`group-standings-${viewingStandingsGroupId}`, `${groupName}-clasificacion.png`);
                  }}
                  variant="default" 
                  disabled={!viewingStandingsGroupId || viewingGroupStandings.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />Exportar Clasificación PNG
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isAdmin && selectedGroupForZones && (
          <Dialog open={isDefineZoneModalOpen} onOpenChange={setIsDefineZoneModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Gestionar Zonas de Clasificación para {selectedGroupForZones.name}</DialogTitle>
                <DialogDescription>Establece rangos de puestos y colores para diferentes zonas de clasificación.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2 p-3 border rounded-md">
                  <h4 className="font-semibold text-sm">Zonas Actuales</h4>
                  {(selectedGroupForZones.classificationZones || []).length === 0 && <p className="text-xs text-muted-foreground">Aún no se han definido zonas.</p>}
                  <ul className="space-y-1">
                    {(selectedGroupForZones.classificationZones || []).map(zone => (
                      <li key={zone.id} className={`flex items-center justify-between p-2 rounded-md text-xs ${zone.colorClass.split(' ')[0].replace('bg-', 'text-').replace('-500/70', '-foreground').replace('-700/40', '-foreground')} ${zone.colorClass}`}>
                        <span>{zone.name} (Puestos {zone.rankMin}-{zone.rankMax})</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive-foreground hover:bg-destructive/80">
                               <X className="h-3 w-3" />
                             </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar Zona: {zone.name}?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemoveClassificationZone(selectedGroupForZones.id, zone.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Eliminar Zona
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3 p-3 border rounded-md">
                  <h4 className="font-semibold text-sm">Añadir Nueva Zona</h4>
                  <div>
                    <Label htmlFor="zoneName">Nombre de la Zona</Label>
                    <Input id="zoneName" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="ej: Ascenso, Descenso" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="minRank">Puesto Mín.</Label>
                      <Input id="minRank" type="number" value={newZoneMinRank} onChange={e => setNewZoneMinRank(e.target.value)} placeholder="ej: 1" min="1" />
                    </div>
                    <div>
                      <Label htmlFor="maxRank">Puesto Máx.</Label>
                      <Input id="maxRank" type="number" value={newZoneMaxRank} onChange={e => setNewZoneMaxRank(e.target.value)} placeholder="ej: 3" min="1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="zoneColor">Color</Label>
                    <Select value={newZoneColorClass} onValueChange={setNewZoneColorClass}>
                      <SelectTrigger id="zoneColor"><SelectValue placeholder="Seleccionar color" /></SelectTrigger>
                      <SelectContent>
                        {classificationColorOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center">
                              <span className={`w-3 h-3 rounded-sm mr-2 border ${opt.value.split(' ')[0]}`}></span>
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddClassificationZone} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Añadir Zona</Button>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Hecho</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground border-t pt-4">
        {groups.length} grupo{groups.length === 1 ? '' : 's'} configurado{groups.length !== 1 ? 's' : ''}. 
        {isAdmin && " Define zonas de clasificación para las tablas en cada grupo."}
      </CardFooter>
    </Card>
  );
}


    

    