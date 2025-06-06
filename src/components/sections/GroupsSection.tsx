

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTournamentStore } from '@/lib/store';
import type { Group as GroupType, Team, Match as MatchType, Standing, ClassificationZone, RandomGroupDistributionConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { LayoutGrid, PlusCircle, Trash2, Users, ListChecks, RefreshCcw, Download, Save, ListOrdered, Palette, Settings, X, Camera, Shuffle, Edit, SlidersHorizontal, CheckCircle, CircleOff, ImageDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  groupName?: string; // Optional group name for multi-export titles
  isMultiExport?: boolean; // Flag to adjust styling for multi-export
}

export function StandingsTable({ standings, getTeamName, classificationZones, groupName, isMultiExport }: StandingsTableProps) {
  if (standings.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No hay partidos jugados o clasificaciones para mostrar.</p>;
  }
  
  const activeZones = classificationZones.filter(zone => 
    standings.some(s => s.rank !== undefined && s.rank >= zone.rankMin && s.rank <= zone.rankMax)
  ).sort((a,b) => a.rankMin - b.rankMin);

  const tableId = groupName ? `standings-table-${groupName.replace(/\s+/g, '-')}` : undefined;

  return (
    <div className={`bg-card rounded-md ${isMultiExport ? 'p-4 shadow-md border' : ''}`} id={tableId}>
      {groupName && isMultiExport && <h3 className="text-lg font-semibold mb-3 text-center">{groupName}</h3>}
      <ScrollArea className={`${isMultiExport ? '' : 'max-h-[60vh]'} rounded-md border`}>
        <Table className="w-full table-fixed">
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-center font-semibold w-20 px-2 py-3">#</TableHead>
              <TableHead className="font-semibold px-3 py-3">Equipo</TableHead>
              <TableHead className="text-center font-semibold w-12 px-2 py-3">PJ</TableHead>
              <TableHead className="text-center font-semibold w-12 px-2 py-3">G</TableHead>
              <TableHead className="text-center font-semibold w-12 px-2 py-3">E</TableHead>
              <TableHead className="text-center font-semibold w-12 px-2 py-3">P</TableHead>
              <TableHead className="text-center font-semibold w-12 px-2 py-3">GF</TableHead>
              <TableHead className="text-center font-semibold w-12 px-2 py-3">GC</TableHead>
              <TableHead className="text-center font-semibold w-12 px-2 py-3">DG</TableHead>
              <TableHead className="text-center font-semibold w-12 px-2 py-3">Pts</TableHead>
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
                <TableCell className="text-center font-medium px-2 py-3">{s.played}</TableCell>
                <TableCell className="text-center font-medium px-2 py-3">{s.won}</TableCell>
                <TableCell className="text-center font-medium px-2 py-3">{s.drawn}</TableCell>
                <TableCell className="text-center font-medium px-2 py-3">{s.lost}</TableCell>
                <TableCell className="text-center font-medium px-2 py-3">{s.goalsFor}</TableCell>
                <TableCell className="text-center font-medium px-2 py-3">{s.goalsAgainst}</TableCell>
                <TableCell className="text-center font-medium px-2 py-3">{s.goalDifference}</TableCell>
                <TableCell className="text-center font-semibold px-2 py-3">{s.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      {activeZones.length > 0 && !isMultiExport && (
        <div className="mt-4 p-3 border rounded-md space-y-1 text-xs text-muted-foreground">
          <h4 className="font-semibold text-sm text-foreground mb-1.5">Leyenda de Zonas:</h4>
          {activeZones.map(zone => (
            <div key={zone.id} className="flex items-center py-1">
              <span className={`w-3 h-3 rounded-sm mr-2 border border-foreground/20 ${zone.colorClass.split(' ')[0]}`}></span>
              <span>{zone.name} (Puestos {zone.rankMin}-{zone.rankMax})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


interface RandomDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDistribute: (config: RandomGroupDistributionConfig) => void;
  numAvailableTeams: number;
}

function RandomDistributionModal({ isOpen, onClose, onDistribute, numAvailableTeams }: RandomDistributionModalProps) {
  const [numGroups, setNumGroups] = useState('2');
  const [teamsPerGroup, setTeamsPerGroup] = useState('');
  const [groupNamePrefix, setGroupNamePrefix] = useState('Grupo ');
  const [autoGenerateMatches, setAutoGenerateMatches] = useState(true);
  const [roundsPerGroup, setRoundsPerGroup] = useState<'1' | '2'>('1');
  const { toast } = useToast();

  const handleSubmit = () => {
    const numGroupsVal = parseInt(numGroups);
    if (isNaN(numGroupsVal) || numGroupsVal <= 0) {
      toast({ title: "Error", description: "Número de grupos debe ser un entero positivo.", variant: "destructive" });
      return;
    }
    if (numGroupsVal > numAvailableTeams) {
       toast({ title: "Error", description: "No puedes crear más grupos que equipos disponibles.", variant: "destructive" });
      return;
    }

    const teamsPerGroupVal = teamsPerGroup ? parseInt(teamsPerGroup) : undefined;
    if (teamsPerGroupVal !== undefined && (isNaN(teamsPerGroupVal) || teamsPerGroupVal <= 0)) {
      toast({ title: "Error", description: "Equipos por grupo debe ser un entero positivo o estar vacío.", variant: "destructive" });
      return;
    }

    onDistribute({
      numGroups: numGroupsVal,
      teamsPerGroup: teamsPerGroupVal,
      groupNamePrefix: groupNamePrefix.trim() === '' ? undefined : groupNamePrefix.trim(),
      autoGenerateMatches,
      roundsPerGroupIfAutoGenerated: roundsPerGroup,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Distribución Aleatoria de Equipos en Grupos</DialogTitle>
          <DialogDescription>
            Crea grupos y asigna equipos automáticamente. Los equipos se distribuirán lo más equitativamente posible.
            Total equipos disponibles: {numAvailableTeams}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="numGroupsDist">Número de Grupos a Crear</Label>
            <Input id="numGroupsDist" type="number" value={numGroups} onChange={e => setNumGroups(e.target.value)} min="1" />
          </div>
          <div>
            <Label htmlFor="teamsPerGroupDist">Equipos por Grupo (opcional, si no se especifica se distribuyen equitativamente)</Label>
            <Input id="teamsPerGroupDist" type="number" value={teamsPerGroup} onChange={e => setTeamsPerGroup(e.target.value)} placeholder="Ej: 4" min="1" />
          </div>
          <div>
            <Label htmlFor="groupNamePrefixDist">Prefijo para Nombre de Grupo</Label>
            <Input id="groupNamePrefixDist" value={groupNamePrefix} onChange={e => setGroupNamePrefix(e.target.value)} placeholder="Ej: Grupo, Zona" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="autoGenerateMatchesDist" checked={autoGenerateMatches} onCheckedChange={(checked) => setAutoGenerateMatches(!!checked)} />
            <Label htmlFor="autoGenerateMatchesDist">Generar partidos automáticamente para estos grupos</Label>
          </div>
          {autoGenerateMatches && (
            <div>
              <Label>Rondas por grupo (si se generan partidos)</Label>
              <RadioGroup value={roundsPerGroup} onValueChange={(v: '1' | '2') => setRoundsPerGroup(v)} className="flex space-x-4 mt-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="r1-dist" /> <Label htmlFor="r1-dist">1 Ronda (Solo Ida)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="r2-dist" /> <Label htmlFor="r2-dist">2 Rondas (Ida y Vuelta)</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit}>Distribuir Equipos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ManualMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatch: (teamAId: string, teamBId: string) => void;
  groupTeams: Team[];
  groupName: string;
}

function ManualMatchModal({ isOpen, onClose, onAddMatch, groupTeams, groupName }: ManualMatchModalProps) {
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const { toast } = useToast();

  const availableTeamsForB = teamAId ? groupTeams.filter(t => t.id !== teamAId) : groupTeams;

  const handleSubmit = () => {
    if (!teamAId || !teamBId) {
      toast({ title: "Error", description: "Debes seleccionar ambos equipos.", variant: "destructive" });
      return;
    }
    if (teamAId === teamBId) {
       toast({ title: "Error", description: "Un equipo no puede jugar contra sí mismo.", variant: "destructive" });
      return;
    }
    onAddMatch(teamAId, teamBId);
    setTeamAId('');
    setTeamBId('');
  };
  
  useEffect(() => { 
    if (teamAId && teamAId === teamBId) {
      setTeamBId('');
    }
  }, [teamAId, teamBId]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Partido Manual a {groupName}</DialogTitle>
          <DialogDescription>Selecciona los dos equipos que se enfrentarán.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="teamASelect">Equipo Local</Label>
            <Select value={teamAId} onValueChange={setTeamAId}>
              <SelectTrigger id="teamASelect"><SelectValue placeholder="Seleccionar Equipo A" /></SelectTrigger>
              <SelectContent>
                {groupTeams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="teamBSelect">Equipo Visitante</Label>
            <Select value={teamBId} onValueChange={setTeamBId} disabled={!teamAId}>
              <SelectTrigger id="teamBSelect"><SelectValue placeholder="Seleccionar Equipo B" /></SelectTrigger>
              <SelectContent>
                {availableTeamsForB.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                {teamAId && availableTeamsForB.length === 0 && <SelectItem value="" disabled>No hay otros equipos disponibles</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={handleSubmit} disabled={!teamAId || !teamBId || teamAId === teamBId}>Añadir Partido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function GroupsSection() {
  const { 
    groups, teams, isAdmin, createGroup, deleteGroup, addTeamToGroup, removeTeamFromGroup, 
    generateGroupMatches, updateGroupMatchScore, getTeamById, getGroupStandings,
    addGroupClassificationZone, removeGroupClassificationZone,
    distributeTeamsRandomlyToGroups, setGroupMatchGenerationMode, setGroupRounds,
    addManualMatchToGroup, removeManualMatchFromGroup, clearGroupMatches,
    selectedGroupIdsForExport, toggleSelectGroupForExport, clearSelectedGroupsForExport
  } = useTournamentStore();
  
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedTeamIdForGroupAdd, setSelectedTeamIdForGroupAdd] = useState<string | null>(null);
  const [viewingStandingsGroupId, setViewingStandingsGroupId] = useState<string | null>(null);
  const [matchScoresInput, setMatchScoresInput] = useState<Record<string, { scoreA: string, scoreB: string }>>({});
  
  const [isDefineZoneModalOpen, setIsDefineZoneModalOpen] = useState(false);
  const [selectedGroupForZones, setSelectedGroupForZones] = useState<GroupType | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneMinRank, setNewZoneMinRank] = useState('');
  const [newZoneMaxRank, setNewZoneMaxRank] = useState('');
  const [newZoneColorClass, setNewZoneColorClass] = useState(classificationColorOptions[0].value);

  const [isRandomDistModalOpen, setIsRandomDistModalOpen] = useState(false);
  const [isManualMatchModalOpen, setIsManualMatchModalOpen] = useState(false);
  const [groupForManualMatch, setGroupForManualMatch] = useState<GroupType | null>(null);
  
  const { toast } = useToast();
  const multiExportRef = useRef<HTMLDivElement>(null);


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
  
  const handleAddTeamToSelectedGroup = (groupId: string, teamId: string | null) => {
    if (groupId && teamId) {
      addTeamToGroup(groupId, teamId);
      const group = groups.find(g => g.id === groupId);
      const team = getTeamById(teamId);
      toast({ title: "Equipo Añadido al Grupo", description: `El equipo "${team?.name}" fue añadido al grupo "${group?.name}".` });
      setSelectedTeamIdForGroupAdd(null); 
    } else {
      toast({ title: "Error", description: "Por favor, selecciona un grupo y un equipo.", variant: "destructive" });
    }
  };
  
  const availableTeamsForGroupAdd = (groupId: string) => {
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

  const handleDistributeRandomly = (config: RandomGroupDistributionConfig) => {
    distributeTeamsRandomlyToGroups(config);
    toast({ title: "Distribución Aleatoria Completada", description: "Los equipos han sido distribuidos en los grupos." });
  };

  const handleToggleMatchMode = (group: GroupType) => {
    const newMode = group.matchGenerationMode === 'automatic' ? 'manual' : 'automatic';
    setGroupMatchGenerationMode(group.id, newMode);
    toast({ title: "Modo de Partidos Cambiado", description: `El grupo ${group.name} está ahora en modo ${newMode === 'automatic' ? 'automático' : 'manual'}. Los partidos anteriores han sido limpiados.` });
  };
  
  const handleSetGroupRoundsConfig = (groupId: string, rounds: '1' | '2') => {
    setGroupRounds(groupId, rounds === '1' ? 1 : 2);
    toast({title: "Rondas Actualizadas", description: "Los partidos se han regenerado si el modo es automático."})
  }

  const openManualMatchModal = (group: GroupType) => {
    setGroupForManualMatch(group);
    setIsManualMatchModalOpen(true);
  };

  const handleAddManualMatchSubmit = (teamAId: string, teamBId: string) => {
    if (groupForManualMatch) {
      addManualMatchToGroup(groupForManualMatch.id, teamAId, teamBId);
      toast({ title: "Partido Manual Añadido", description: `Partido entre ${getTeamById(teamAId)?.name} y ${getTeamById(teamBId)?.name} añadido.` });
    }
  };
  
  const handleExportMultipleGroups = async () => {
    if (selectedGroupIdsForExport.length === 0) {
      toast({ title: "Selección Vacía", description: "Selecciona al menos un grupo para exportar.", variant: "default" });
      return;
    }
    // Temporarily show the hidden div
    if (multiExportRef.current) {
      multiExportRef.current.style.display = 'block';
      // Ensure content is rendered before capturing
      await new Promise(resolve => setTimeout(resolve, 500)); 
      exportElementAsPNG('multi-group-export-container', 'Multi-Grupo-Clasificaciones.png');
      multiExportRef.current.style.display = 'none'; // Hide it again
      clearSelectedGroupsForExport();
    } else {
      toast({ title: "Error de Exportación", description: "No se pudo encontrar el contenedor de exportación.", variant: "destructive" });
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
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-lg">Opciones de Administración de Grupos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex space-x-2">
                    <Input 
                        placeholder="Nombre del Grupo (ej: Grupo A)" 
                        value={newGroupName} 
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                    />
                    <Button onClick={handleCreateGroup}><PlusCircle className="mr-2 h-4 w-4" />Crear Grupo</Button>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <Button onClick={() => setIsRandomDistModalOpen(true)} variant="outline" className="w-full md:w-auto">
                        <Shuffle className="mr-2 h-4 w-4" /> Distribución Aleatoria Global
                    </Button>
                    <Button 
                        onClick={handleExportMultipleGroups} 
                        variant="outline" 
                        className="w-full md:w-auto"
                        disabled={selectedGroupIdsForExport.length === 0}
                    >
                        <ImageDown className="mr-2 h-4 w-4" /> Exportar Seleccionados ({selectedGroupIdsForExport.length})
                    </Button>
                </div>
            </CardContent>
          </Card>
        )}

        {groups.length === 0 && <p className="text-muted-foreground text-center py-4">Aún no se han creado grupos.</p>}

        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map(group => (
          <Card key={group.id} id={`group-card-${group.id}`} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex items-center">
                    {isAdmin && (
                        <Checkbox
                        id={`select-group-${group.id}`}
                        checked={selectedGroupIdsForExport.includes(group.id)}
                        onCheckedChange={() => toggleSelectGroupForExport(group.id)}
                        className="mr-3 self-center"
                        aria-label={`Seleccionar grupo ${group.name} para exportar`}
                        />
                    )}
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                </div>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" /> <span className="sr-only">Eliminar Grupo</span>
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
                <details className="p-3 border rounded-md bg-muted/20 space-y-3">
                  <summary className="font-semibold flex items-center cursor-pointer hover:text-primary">
                    <SlidersHorizontal className="mr-2 h-4 w-4 text-primary" />Configuración del Grupo
                  </summary>
                  
                  <div className="space-y-1 pt-2">
                    <Label>Modo de Partidos: <span className="font-normal">{group.matchGenerationMode === 'automatic' ? 'Automático' : 'Manual'}</span></Label>
                    <Button onClick={() => handleToggleMatchMode(group)} variant="outline" size="sm">
                      Cambiar a Modo {group.matchGenerationMode === 'automatic' ? 'Manual' : 'Automático'}
                    </Button>
                  </div>

                  {group.matchGenerationMode === 'automatic' && (
                    <div className="space-y-1">
                      <Label>Rondas (Automático):</Label>
                      <Select value={String(group.rounds)} onValueChange={(val: '1' | '2') => handleSetGroupRoundsConfig(group.id, val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Ronda (Solo Ida)</SelectItem>
                          <SelectItem value="2">2 Rondas (Ida y Vuelta)</SelectItem>
                        </SelectContent>
                      </Select>
                       <Button onClick={() => { generateGroupMatches(group.id); toast({ title: "Partidos (Auto) Generados" }); }} className="w-full mt-1" variant="secondary" size="sm">
                        <RefreshCcw className="mr-2 h-4 w-4"/>Generar/Re-generar Partidos (Auto)
                      </Button>
                    </div>
                  )}

                  {group.matchGenerationMode === 'manual' && (
                    <div className="space-y-2">
                      <Button onClick={() => openManualMatchModal(group)} variant="secondary" size="sm" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />Añadir Partido Manualmente
                      </Button>
                      {(group.matches || []).length > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="w-full">
                              <Trash2 className="mr-2 h-4 w-4" />Eliminar Todos los Partidos Manuales
                            </Button>
                          </AlertDialogTrigger>
                           <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar todos los partidos manuales de {group.name}?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {clearGroupMatches(group.id); toast({title: "Partidos Manuales Eliminados"})}} className="bg-destructive">Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                  <div className="pt-2">
                    <h4 className="font-semibold text-sm mb-1 flex items-center"><Users className="mr-2 h-4 w-4 text-primary" />Añadir Equipos al Grupo</h4>
                    <div className="flex space-x-2">
                      <Select onValueChange={(teamId) => setSelectedTeamIdForGroupAdd(teamId)} value={selectedTeamIdForGroupAdd || ""}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                        <SelectContent>
                          {availableTeamsForGroupAdd(group.id).map(team => (
                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                          ))}
                           {availableTeamsForGroupAdd(group.id).length === 0 && <SelectItem value="no-teams" disabled>No hay equipos disponibles</SelectItem>}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => handleAddTeamToSelectedGroup(group.id, selectedTeamIdForGroupAdd)} disabled={!selectedTeamIdForGroupAdd}>Añadir</Button>
                    </div>
                  </div>
                </details>
              )}
              
              <div>
                 <h4 className="font-semibold mb-1 flex items-center"><Users className="mr-2 h-4 w-4" />Equipos en {group.name} ({(group.teamIds || []).length})</h4>
                {(group.teamIds || []).length === 0 ? <p className="text-sm text-muted-foreground">No hay equipos asignados.</p> : (
                  <ul className="space-y-1 text-sm border rounded-md p-2 max-h-32 overflow-y-auto">
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
              
              {(group.matches || []).length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold flex items-center"><ListOrdered className="mr-2 h-4 w-4 text-primary" />Partidos ({group.matchGenerationMode === 'manual' ? 'Manual' : 'Automático'})</h4>
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
                               {isAdmin && group.matchGenerationMode === 'manual' && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeManualMatchFromGroup(group.id, match.id)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
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
                      {(group.matches || []).length === 0 && <p className="text-sm text-muted-foreground p-3 text-center">No hay partidos para este grupo.</p>}
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
          <DialogContent className="max-w-4xl">
            <DialogHeader className="flex flex-row justify-between items-start pr-6 pb-4 border-b mb-4">
                <div className="space-y-1">
                    <DialogTitle className="flex items-center text-xl">
                        <ListChecks className="mr-2 h-5 w-5 text-primary" />
                        Clasificación: {viewingGroup?.name}
                    </DialogTitle>
                    <DialogDescription>Tabla de posiciones y zonas del grupo.</DialogDescription>
                </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                    if(viewingStandingsGroupId && viewingGroup) {
                        exportElementAsPNG(`group-standings-${viewingStandingsGroupId}`, `Clasificacion-${viewingGroup.name.replace(/\s+/g, '_')}.png`);
                    } else {
                        toast({title: "Error de Exportación", description: "No se pudo encontrar el grupo para exportar.", variant: "destructive"})
                    }
                }}
                disabled={!viewingStandingsGroupId || viewingGroupStandings.length === 0}
                title="Exportar esta tabla de clasificación como PNG"
              >
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
                        {(viewingGroupClassificationZones || []).sort((a,b) => a.rankMin - b.rankMin).map(zone => (
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
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 py-4 pr-2">
                  <div className="space-y-2 p-3 border rounded-md">
                    <h4 className="font-semibold text-sm">Zonas Actuales</h4>
                    {(selectedGroupForZones.classificationZones || []).length === 0 && <p className="text-xs text-muted-foreground">Aún no se han definido zonas.</p>}
                    <ul className="space-y-1">
                      {(selectedGroupForZones.classificationZones || []).sort((a,b) => a.rankMin - b.rankMin).map(zone => (
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
              </ScrollArea>
              <DialogFooter className="mt-4 pt-4 border-t">
                <DialogClose asChild>
                  <Button variant="outline">Hecho</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {isAdmin && isRandomDistModalOpen && (
          <RandomDistributionModal 
            isOpen={isRandomDistModalOpen}
            onClose={() => setIsRandomDistModalOpen(false)}
            onDistribute={handleDistributeRandomly}
            numAvailableTeams={teams.length}
          />
        )}
         {isAdmin && isManualMatchModalOpen && groupForManualMatch && (
          <ManualMatchModal
            isOpen={isManualMatchModalOpen}
            onClose={() => { setIsManualMatchModalOpen(false); setGroupForManualMatch(null);}}
            onAddMatch={handleAddManualMatchSubmit}
            groupTeams={groupForManualMatch.teamIds.map(id => getTeamById(id)).filter(t => t) as Team[]}
            groupName={groupForManualMatch.name}
          />
        )}

        {/* Hidden container for multi-group export */}
        <div ref={multiExportRef} id="multi-group-export-container" style={{ display: 'none', position: 'absolute', left: '-9999px', top: '-9999px' }} className="p-4 bg-background space-y-8">
          {selectedGroupIdsForExport.map(groupId => {
            const group = groups.find(g => g.id === groupId);
            if (!group) return null;
            const standings = getGroupStandings(groupId);
            return (
              <div key={`export-${groupId}`} className="mb-8 last:mb-0">
                <StandingsTable
                  standings={standings}
                  getTeamName={(id) => getTeamById(id)?.name || 'N/A'}
                  classificationZones={group.classificationZones || []}
                  groupName={group.name}
                  isMultiExport={true}
                />
              </div>
            );
          })}
        </div>
        
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground border-t pt-4">
        {groups.length} grupo{groups.length === 1 ? '' : 's'} configurado{groups.length !== 1 ? 's' : ''}. 
        {isAdmin && " Administra la generación de partidos y zonas de clasificación para cada grupo."}
      </CardFooter>
    </Card>
  );
}
