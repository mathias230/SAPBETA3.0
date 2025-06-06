
"use client";

import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '@/lib/store';
import type { Team, Match as MatchType, Standing, League as LeagueType, ClassificationZone } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ListChecks, PlusCircle, Trash2, Users, RefreshCcw, Download, Save, Palette, Settings, X, Trophy, SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { StandingsTable, classificationColorOptions } from '@/components/sections/GroupsSection'; 
import { useToast } from "@/hooks/use-toast";
import { exportElementAsPNG } from '@/lib/export';

interface ManualMatchModalLeagueProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatch: (teamAId: string, teamBId: string) => void;
  leagueTeams: Team[];
  leagueName: string;
}

function ManualMatchModalLeague({ isOpen, onClose, onAddMatch, leagueTeams, leagueName }: ManualMatchModalLeagueProps) {
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const { toast } = useToast();

  const availableTeamsForB = teamAId ? leagueTeams.filter(t => t.id !== teamAId) : leagueTeams;

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
          <DialogTitle>Añadir Partido Manual a {leagueName}</DialogTitle>
          <DialogDescription>Selecciona los dos equipos que se enfrentarán.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="teamALeagueSelect">Equipo Local</Label>
            <Select value={teamAId} onValueChange={setTeamAId}>
              <SelectTrigger id="teamALeagueSelect"><SelectValue placeholder="Seleccionar Equipo A" /></SelectTrigger>
              <SelectContent>
                {leagueTeams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="teamBLeagueSelect">Equipo Visitante</Label>
            <Select value={teamBId} onValueChange={setTeamBId} disabled={!teamAId}>
              <SelectTrigger id="teamBLeagueSelect"><SelectValue placeholder="Seleccionar Equipo B" /></SelectTrigger>
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


export default function LeagueSection() {
  const { 
    league, teams, isAdmin, setupLeague, deleteLeague, generateLeagueMatches, 
    updateLeagueMatchScore, getTeamById, getLeagueStandings,
    addLeagueClassificationZone, removeLeagueClassificationZone,
    setLeagueMatchGenerationMode, addManualMatchToLeague, removeManualMatchFromLeague, clearLeagueMatches, setLeagueRounds
  } = useTournamentStore();
  
  const [newLeagueName, setNewLeagueName] = useState('');
  const [selectedTeamIdsForLeague, setSelectedTeamIdsForLeague] = useState<string[]>([]);
  const [initialLeagueRounds, setInitialLeagueRounds] = useState<"1" | "2">("1");

  const [matchScoresInput, setMatchScoresInput] = useState<Record<string, { scoreA: string, scoreB: string }>>({});
  const [isDefineZoneModalOpen, setIsDefineZoneModalOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneMinRank, setNewZoneMinRank] = useState('');
  const [newZoneMaxRank, setNewZoneMaxRank] = useState('');
  const [newZoneColorClass, setNewZoneColorClass] = useState(classificationColorOptions[0].value);
  const [isManualMatchModalOpen, setIsManualMatchModalOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (!league) {
        setMatchScoresInput({});
        return;
    }
    const newFormState: Record<string, { scoreA: string, scoreB: string }> = {};
    league.matches.forEach(match => {
      newFormState[match.id] = {
        scoreA: match.played && match.scoreA !== undefined ? String(match.scoreA) : '',
        scoreB: match.played && match.scoreB !== undefined ? String(match.scoreB) : '',
      };
    });
     setMatchScoresInput(prevScores => {
      const mergedState = {...newFormState};
      Object.keys(prevScores).forEach(matchId => {
        const leagueMatch = league.matches.find(m => m.id === matchId);
        if (leagueMatch && !leagueMatch.played && (prevScores[matchId].scoreA !== '' || prevScores[matchId].scoreB !== '')) {
          mergedState[matchId] = prevScores[matchId];
        } else if (!leagueMatch) {
           delete mergedState[matchId];
        }
      });
      return mergedState;
    });
  }, [league]);

  const handleMatchScoreInputChange = (matchId: string, team: 'A' | 'B', value: string) => {
    setMatchScoresInput(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { scoreA: '', scoreB: '' }),
        [team === 'A' ? 'scoreA' : 'scoreB']: value,
      }
    }));
  };

  const handleSaveMatchScore = (matchId: string) => {
    const scores = matchScoresInput[matchId];
    if (scores && scores.scoreA.trim() !== '' && scores.scoreB.trim() !== '') {
      const scoreA = parseInt(scores.scoreA);
      const scoreB = parseInt(scores.scoreB);
      if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
        toast({ title: "Error", description: "Los marcadores deben ser números válidos no negativos.", variant: "destructive" });
        return;
      }
      updateLeagueMatchScore(matchId, scoreA, scoreB);
      toast({ title: "Partido Actualizado", description: "El marcador ha sido registrado." });
    } else {
      toast({ title: "Error", description: "Por favor, ingresa ambos marcadores.", variant: "destructive" });
    }
  };

  const handleSetupLeague = () => {
    if (!newLeagueName.trim()) {
      toast({ title: "Error", description: "El nombre de la liga no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (selectedTeamIdsForLeague.length < 2) {
      toast({ title: "Error", description: "Se necesitan al menos 2 equipos para la liga.", variant: "destructive" });
      return;
    }
    setupLeague(newLeagueName.trim(), selectedTeamIdsForLeague, initialLeagueRounds === "1" ? 1 : 2, 'automatic'); // Default to automatic
    toast({ title: "Liga Creada", description: `La liga "${newLeagueName.trim()}" ha sido configurada.` });
    setNewLeagueName('');
    setSelectedTeamIdsForLeague([]);
    setInitialLeagueRounds("1");
  };

  const handleAddClassificationZone = () => {
    if (!league) return;
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
     if ((league.classificationZones || []).some(zone => 
        (rankMin >= zone.rankMin && rankMin <= zone.rankMax) || 
        (rankMax >= zone.rankMin && rankMax <= zone.rankMax) ||
        (zone.rankMin >= rankMin && zone.rankMin <= rankMax) ||
        (zone.rankMax >= rankMin && zone.rankMax <= rankMax)
     )) {
        toast({ title: "Error", description: "El rango de puestos se superpone con una zona existente.", variant: "destructive" }); return;
     }

    addLeagueClassificationZone({
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
  };

  const handleRemoveClassificationZone = (zoneId: string) => {
    removeLeagueClassificationZone(zoneId);
    toast({ title: "Zona de Clasificación Eliminada" });
  };
  
  const handleToggleLeagueMatchMode = () => {
    if (!league) return;
    const newMode = league.matchGenerationMode === 'automatic' ? 'manual' : 'automatic';
    setLeagueMatchGenerationMode(newMode);
    toast({ title: "Modo de Partidos Cambiado", description: `La liga está ahora en modo ${newMode === 'automatic' ? 'automático' : 'manual'}. Los partidos anteriores han sido limpiados.` });
  };

  const handleSetLeagueRoundsConfig = (rounds: '1' | '2') => {
    if (!league) return;
    setLeagueRounds(rounds === '1' ? 1 : 2);
    toast({title: "Rondas Actualizadas", description: "Los partidos se han regenerado si el modo es automático."})
  }

  const handleAddManualMatchSubmit = (teamAId: string, teamBId: string) => {
    if (league) {
      addManualMatchToLeague(teamAId, teamBId);
      toast({ title: "Partido Manual Añadido", description: `Partido entre ${getTeamById(teamAId)?.name} y ${getTeamById(teamBId)?.name} añadido a la liga.` });
    }
  };

  if (!league && isAdmin) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <ListChecks className="mr-2 h-6 w-6 text-primary" /> Configurar Liga
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="leagueName">Nombre de la Liga</Label>
            <Input id="leagueName" value={newLeagueName} onChange={(e) => setNewLeagueName(e.target.value)} placeholder="Ej: Liga Premier de Verano" />
          </div>
          <div>
            <Label>Equipos Participantes ({selectedTeamIdsForLeague.length})</Label>
            <ScrollArea className="h-40 border rounded-md p-2">
              {teams.map(team => (
                <div key={team.id} className="flex items-center space-x-2 mb-1">
                  <input 
                    type="checkbox" 
                    id={`team-${team.id}-league`} 
                    checked={selectedTeamIdsForLeague.includes(team.id)}
                    onChange={() => {
                      setSelectedTeamIdsForLeague(prev => 
                        prev.includes(team.id) ? prev.filter(id => id !== team.id) : [...prev, team.id]
                      )
                    }}
                  />
                  <Label htmlFor={`team-${team.id}-league`}>{team.name}</Label>
                </div>
              ))}
               {teams.length === 0 && <p className="text-sm text-muted-foreground p-2">No hay equipos creados. Ve a la pestaña 'Equipos'.</p>}
            </ScrollArea>
          </div>
          <div>
            <Label>Número de Rondas (para partidos automáticos)</Label>
            <RadioGroup defaultValue="1" value={initialLeagueRounds} onValueChange={(v: "1" | "2") => setInitialLeagueRounds(v)} className="flex space-x-4 mt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="r1-league-init" />
                <Label htmlFor="r1-league-init">1 Ronda (Solo Ida)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="r2-league-init" />
                <Label htmlFor="r2-league-init">2 Rondas (Ida y Vuelta)</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSetupLeague}><PlusCircle className="mr-2 h-4 w-4" />Crear Liga</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!league) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
             <ListChecks className="mr-2 h-6 w-6 text-primary" /> Gestión de Liga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <ListChecks className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aún no se ha configurado una liga.</p>
            {isAdmin && <p className="text-sm text-muted-foreground/80">El administrador puede crear una liga.</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  const leagueStandings = getLeagueStandings();
  const leagueTeams = league.teamIds.map(id => getTeamById(id)).filter(t => t) as Team[];

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-2xl font-headline">
            <Trophy className="mr-2 h-6 w-6 text-yellow-500" /> {league.name}
          </CardTitle>
          {isAdmin && (
            <div className="flex space-x-2">
                 <Button variant="outline" size="sm" onClick={() => setIsDefineZoneModalOpen(true)}>
                    <Palette className="mr-1 h-4 w-4" />Zonas
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" />Eliminar Liga</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Liga: {league.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la liga y todos sus datos asociados. No se puede deshacer.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteLeague(); toast({ title: "Liga Eliminada" });}} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          )}
        </CardHeader>
        {isAdmin && (
          <CardContent className="border-t pt-4">
            <details className="p-3 border rounded-md bg-muted/20 space-y-3">
              <summary className="font-semibold flex items-center cursor-pointer hover:text-primary">
                <SlidersHorizontal className="mr-2 h-4 w-4 text-primary" />Configuración de la Liga
              </summary>
              
              <div className="space-y-1 pt-2">
                <Label>Modo de Partidos: <span className="font-normal">{league.matchGenerationMode === 'automatic' ? 'Automático' : 'Manual'}</span></Label>
                <Button onClick={handleToggleLeagueMatchMode} variant="outline" size="sm">
                  Cambiar a Modo {league.matchGenerationMode === 'automatic' ? 'Manual' : 'Automático'}
                </Button>
              </div>

              {league.matchGenerationMode === 'automatic' && (
                <div className="space-y-1">
                  <Label>Rondas (Automático):</Label>
                  <Select value={String(league.settings.rounds)} onValueChange={(val: '1' | '2') => handleSetLeagueRoundsConfig(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Ronda (Solo Ida)</SelectItem>
                      <SelectItem value="2">2 Rondas (Ida y Vuelta)</SelectItem>
                    </SelectContent>
                  </Select>
                   <Button onClick={() => { generateLeagueMatches(); toast({ title: "Partidos (Auto) Generados" }); }} className="w-full mt-1" variant="secondary" size="sm">
                    <RefreshCcw className="mr-2 h-4 w-4"/>Generar/Re-generar Partidos (Auto)
                  </Button>
                </div>
              )}

              {league.matchGenerationMode === 'manual' && (
                <div className="space-y-2">
                  <Button onClick={() => setIsManualMatchModalOpen(true)} variant="secondary" size="sm" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />Añadir Partido Manualmente
                  </Button>
                  {league.matches.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full">
                          <Trash2 className="mr-2 h-4 w-4" />Eliminar Todos los Partidos Manuales
                        </Button>
                      </AlertDialogTrigger>
                       <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar todos los partidos manuales de {league.name}?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => {clearLeagueMatches(); toast({title: "Partidos Manuales Eliminados"})}} className="bg-destructive">Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </details>
          </CardContent>
        )}
      </Card>

      <Card className="w-full shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
              <CardTitle className="text-xl flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Partidos ({league.matchGenerationMode === 'manual' ? 'Manual' : 'Automático'})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {league.matches.length === 0 ? <p className="text-muted-foreground text-center py-4">No hay partidos.</p> : (
            <ScrollArea className="h-[400px] border rounded-md p-0 md:h-[calc(100vh-550px)]">
              <ul className="space-y-0">
                {league.matches.map((match, matchIndex) => {
                  const teamA = getTeamById(match.teamAId);
                  const teamB = getTeamById(match.teamBId);
                  return (
                    <li key={match.id} className={`p-3 ${matchIndex < league.matches.length - 1 ? 'border-b' : ''} bg-card hover:bg-muted/30`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{teamA?.name || 'TBA'} vs {teamB?.name || 'TBA'}</span>
                         {isAdmin && league.matchGenerationMode === 'manual' && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeManualMatchFromLeague(match.id)}>
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
                            placeholder="Res. A"
                            value={matchScoresInput[match.id]?.scoreA ?? ''}
                            onChange={(e) => handleMatchScoreInputChange(match.id, 'A', e.target.value)}
                            className="w-20 h-8 text-sm"
                            min="0"
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            placeholder="Res. B"
                            value={matchScoresInput[match.id]?.scoreB ?? ''}
                            onChange={(e) => handleMatchScoreInputChange(match.id, 'B', e.target.value)}
                            className="w-20 h-8 text-sm"
                            min="0"
                          />
                          <Button size="sm" className="h-8 text-xs px-3" onClick={() => handleSaveMatchScore(match.id)}>
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
          )}
        </CardContent>
      </Card>

      <Card className="w-full shadow-md mt-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Clasificación</CardTitle>
        </CardHeader>
        <CardContent id="league-standings-export" className="bg-card rounded-md">
          <StandingsTable 
              standings={leagueStandings} 
              getTeamName={(id) => getTeamById(id)?.name || 'N/A'}
              classificationZones={league.classificationZones || []}
            />
        </CardContent>
          <CardFooter className="pt-4 border-t">
              <Button 
                onClick={() => exportElementAsPNG(`league-standings-export`, `${league.name.replace(/\s+/g, '_')}-clasificacion.png`)}
                variant="default" 
                className="w-full"
                disabled={leagueStandings.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />Exportar Clasificación PNG
              </Button>
          </CardFooter>
      </Card>

      {isAdmin && league && (
          <Dialog open={isDefineZoneModalOpen} onOpenChange={setIsDefineZoneModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Definir Zonas de Clasificación para {league.name}</DialogTitle>
                <DialogDescription>Establece rangos de puestos y colores para diferentes zonas de clasificación.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 py-4 pr-2">
                <div className="space-y-2 p-3 border rounded-md">
                  <h4 className="font-semibold text-sm">Zonas Actuales</h4>
                  {(league.classificationZones || []).length === 0 && <p className="text-xs text-muted-foreground">Aún no se han definido zonas.</p>}
                  <ul className="space-y-1">
                    {(league.classificationZones || []).sort((a,b)=>a.rankMin - b.rankMin).map(zone => (
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
                              <AlertDialogAction onClick={() => handleRemoveClassificationZone(zone.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                    <Label htmlFor="leagueZoneName">Nombre de la Zona</Label>
                    <Input id="leagueZoneName" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="ej: Campeón, Clasifica a Copa" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="leagueMinRank">Puesto Mín.</Label>
                      <Input id="leagueMinRank" type="number" value={newZoneMinRank} onChange={e => setNewZoneMinRank(e.target.value)} placeholder="ej: 1" min="1" />
                    </div>
                    <div>
                      <Label htmlFor="leagueMaxRank">Puesto Máx.</Label>
                      <Input id="leagueMaxRank" type="number" value={newZoneMaxRank} onChange={e => setNewZoneMaxRank(e.target.value)} placeholder="ej: 1" min="1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="leagueZoneColor">Color</Label>
                    <Select value={newZoneColorClass} onValueChange={setNewZoneColorClass}>
                      <SelectTrigger id="leagueZoneColor"><SelectValue placeholder="Seleccionar color" /></SelectTrigger>
                      <SelectContent>
                        {classificationColorOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center">
                              <span className={`w-3 h-3 rounded-sm mr-2 border border-foreground/20 ${opt.value.split(' ')[0]}`}></span>
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
         {isAdmin && league && isManualMatchModalOpen && (
          <ManualMatchModalLeague
            isOpen={isManualMatchModalOpen}
            onClose={() => setIsManualMatchModalOpen(false)}
            onAddMatch={handleAddManualMatchSubmit}
            leagueTeams={leagueTeams}
            leagueName={league.name}
          />
        )}
    </div>
  );
}

