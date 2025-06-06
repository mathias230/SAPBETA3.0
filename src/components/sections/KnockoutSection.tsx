
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useTournamentStore } from '@/lib/store';
import type { Team, Match as MatchType, KnockoutStage as KnockoutStageType, KnockoutRound } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { GitFork, PlusCircle, Trash2, Users, Save, Trophy, ChevronRight, Download } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { exportElementAsPNG } from '@/lib/export';


const KnockoutMatchCard: React.FC<{
  match: MatchType;
  roundName: string;
  isAdmin: boolean;
  getTeamName: (id: string) => string;
  onSaveScore: (matchId: string, scoreA: string, scoreB: string) => void;
  initialScoreA: string;
  initialScoreB: string;
}> = ({ match, roundName, isAdmin, getTeamName, onSaveScore, initialScoreA, initialScoreB }) => {
  const [scoreA, setScoreA] = useState(initialScoreA);
  const [scoreB, setScoreB] = useState(initialScoreB);

  useEffect(() => {
    setScoreA(initialScoreA);
    setScoreB(initialScoreB);
  }, [initialScoreA, initialScoreB]);

  const teamAName = getTeamName(match.teamAId);
  const teamBName = getTeamName(match.teamBId);

  const handleSave = () => {
    onSaveScore(match.id, scoreA, scoreB);
  };

  return (
    <div className="bg-card border rounded-lg p-3 min-w-[220px] shadow">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs text-muted-foreground">{roundName} - Partido</p>
        {match.played && <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Jugado</span>}
      </div>
      
      <div className="space-y-1.5">
        <div className={`flex items-center justify-between p-1.5 rounded ${match.played && match.scoreA !== undefined && match.scoreB !== undefined && match.scoreA > match.scoreB ? 'bg-green-500/20 font-semibold' : ''}`}>
          <span className="text-sm truncate" title={teamAName}>{teamAName}</span>
          {isAdmin && !match.played ? (
            <Input type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} className="w-12 h-7 text-xs p-1" min="0" />
          ) : (
            <span className="text-sm font-bold">{match.scoreA ?? '-'}</span>
          )}
        </div>
        <div className="text-center text-xs text-muted-foreground">VS</div>
        <div className={`flex items-center justify-between p-1.5 rounded ${match.played && match.scoreA !== undefined && match.scoreB !== undefined && match.scoreA < match.scoreB ? 'bg-green-500/20 font-semibold' : ''}`}>
           <span className="text-sm truncate" title={teamBName}>{teamBName}</span>
          {isAdmin && !match.played ? (
            <Input type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} className="w-12 h-7 text-xs p-1" min="0" />
          ) : (
            <span className="text-sm font-bold">{match.scoreB ?? '-'}</span>
          )}
        </div>
      </div>
      {isAdmin && !match.played && (teamAName !== 'A Definir' && teamAName !== 'Equipo Eliminado' && teamBName !== 'A Definir' && teamBName !== 'Equipo Eliminado') && (
        <Button size="xs" onClick={handleSave} className="w-full mt-2.5 h-7 text-xs">
          <Save className="mr-1 h-3 w-3" /> Guardar Marcador
        </Button>
      )}
       {isAdmin && match.played && (teamAName !== 'Equipo Eliminado' && teamBName !== 'Equipo Eliminado') &&(
         <Button size="xs" onClick={handleSave} variant="outline" className="w-full mt-2.5 h-7 text-xs">
          <Save className="mr-1 h-3 w-3" /> Actualizar Marcador
        </Button>
       )}
    </div>
  );
};


export default function KnockoutSection() {
  const { 
    knockoutStage, teams, isAdmin, setupKnockoutStage, deleteKnockoutStage, 
    updateKnockoutMatchScore, getTeamById 
  } = useTournamentStore();
  
  const [newStageName, setNewStageName] = useState('');
  const [numTeamsForStage, setNumTeamsForStage] = useState<string>("8");
  const [selectedTeamIdsForStage, setSelectedTeamIdsForStage] = useState<string[]>([]);
  const [matchScoresInput, setMatchScoresInput] = useState<Record<string, { scoreA: string, scoreB: string }>>({});

  const { toast } = useToast();

  const powerOfTwoOptions = [2, 4, 8, 16, 32]; // Added 2 for final only scenario

  useEffect(() => {
    if (!knockoutStage) {
      setMatchScoresInput({});
      return;
    }
    const newScores: Record<string, { scoreA: string, scoreB: string }> = {};
    knockoutStage.rounds.forEach(round => {
      round.matches.forEach(match => {
        newScores[match.id] = {
          scoreA: match.played && match.scoreA !== undefined ? String(match.scoreA) : '',
          scoreB: match.played && match.scoreB !== undefined ? String(match.scoreB) : '',
        };
      });
    });
    setMatchScoresInput(prevScores => {
      const mergedState = {...newScores};
        knockoutStage.rounds.forEach(round => {
            round.matches.forEach(match => {
                if (match.played && (prevScores[match.id]?.scoreA !== '' || prevScores[match.id]?.scoreB !== '')) {
                    // Keep admin-entered scores if match isn't played yet
                } else if (prevScores[match.id] && !match.played ) {
                     mergedState[match.id] = prevScores[match.id];
                }
            });
        });
      return mergedState;
    });
  }, [knockoutStage]);


  const handleSaveKnockoutScore = (roundId: string) => (matchId: string, scoreAStr: string, scoreBStr: string) => {
    const scoreA = parseInt(scoreAStr);
    const scoreB = parseInt(scoreBStr);

    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
      toast({ title: "Error", description: "Los marcadores deben ser números válidos no negativos.", variant: "destructive" });
      return;
    }
    if (scoreA === scoreB) {
      toast({ title: "Error", description: "Los empates no son permitidos en fases eliminatorias.", variant: "destructive" });
      return;
    }
    
    const match = knockoutStage?.rounds.find(r => r.id === roundId)?.matches.find(m => m.id === matchId);
    if (match && (match.teamAId === 'TBD' || match.teamBId === 'TBD' || match.teamAId === 'TBD_DELETED' || match.teamBId === 'TBD_DELETED')) {
        toast({ title: "Error", description: "No se puede registrar marcador si uno o ambos equipos son 'A Definir' o han sido eliminados.", variant: "destructive" });
        return;
    }

    updateKnockoutMatchScore(roundId, matchId, scoreA, scoreB);
    toast({ title: "Partido Actualizado", description: "Marcador registrado y/o fase avanzada." });
  };

  const handleSetupStage = () => {
    if (!newStageName.trim()) {
      toast({ title: "Error", description: "El nombre de la fase no puede estar vacío.", variant: "destructive" });
      return;
    }
    const numTeams = parseInt(numTeamsForStage);
    if (selectedTeamIdsForStage.length !== numTeams) {
      toast({ title: "Error", description: `Debe seleccionar exactamente ${numTeams} equipos.`, variant: "destructive" });
      return;
    }
    setupKnockoutStage(newStageName.trim(), numTeams, selectedTeamIdsForStage);
    toast({ title: "Fase Eliminatoria Creada", description: `La fase "${newStageName.trim()}" ha sido configurada.` });
    setNewStageName('');
    setSelectedTeamIdsForStage([]);
    setNumTeamsForStage("8");
  };
  
  const champion = useMemo(() => {
    if (knockoutStage && knockoutStage.championId) {
      return getTeamById(knockoutStage.championId);
    }
    return null;
  }, [knockoutStage, getTeamById]);

  const handleExportBracket = () => {
    if (knockoutStage) {
        const stageName = knockoutStage.name.replace(/\s+/g, '_') || 'Bracket';
        exportElementAsPNG('knockout-bracket-export-area', `${stageName}.png`);
    } else {
        toast({ title: "Error de Exportación", description: "No hay bracket para exportar.", variant: "destructive"});
    }
  };


  if (!knockoutStage && isAdmin) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <GitFork className="mr-2 h-6 w-6 text-primary" /> Configurar Fase Eliminatoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="stageName">Nombre de la Fase</Label>
            <Input id="stageName" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="Ej: Playoffs, Copa de Oro" />
          </div>
          <div>
            <Label htmlFor="numTeamsStage">Número de Equipos</Label>
            <Select value={numTeamsForStage} onValueChange={setNumTeamsForStage}>
              <SelectTrigger id="numTeamsStage"><SelectValue placeholder="Seleccionar número" /></SelectTrigger>
              <SelectContent>
                {powerOfTwoOptions.map(opt => <SelectItem key={opt} value={String(opt)}>{opt} equipos</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Equipos Participantes ({selectedTeamIdsForStage.length} / {numTeamsForStage})</Label>
            <ScrollArea className="h-40 border rounded-md p-2">
              {teams.map(team => (
                <div key={team.id} className="flex items-center space-x-2 mb-1">
                  <input 
                    type="checkbox" 
                    id={`team-${team.id}-knockout`} 
                    checked={selectedTeamIdsForStage.includes(team.id)}
                    onChange={() => {
                      setSelectedTeamIdsForStage(prev => 
                        prev.includes(team.id) ? prev.filter(id => id !== team.id) : [...prev, team.id]
                      )
                    }}
                    disabled={selectedTeamIdsForStage.length >= parseInt(numTeamsForStage) && !selectedTeamIdsForStage.includes(team.id)}
                  />
                  <Label htmlFor={`team-${team.id}-knockout`}>{team.name}</Label>
                </div>
              ))}
              {teams.length === 0 && <p className="text-sm text-muted-foreground p-2">No hay equipos creados. Ve a la pestaña 'Equipos'.</p>}
               {teams.length < parseInt(numTeamsForStage) && <p className="text-sm text-destructive p-2">No hay suficientes equipos creados para una fase de {numTeamsForStage}.</p>}
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSetupStage} disabled={teams.length < parseInt(numTeamsForStage) || parseInt(numTeamsForStage) < 2}><PlusCircle className="mr-2 h-4 w-4" />Crear Fase</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!knockoutStage) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
             <GitFork className="mr-2 h-6 w-6 text-primary" /> Gestión de Fase Eliminatoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <GitFork className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aún no se ha configurado una fase eliminatoria.</p>
            {isAdmin && <p className="text-sm text-muted-foreground/80">El administrador puede crear una.</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-2xl font-headline">
            <GitFork className="mr-2 h-6 w-6 text-primary" /> {knockoutStage.name}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportBracket} disabled={knockoutStage.rounds.length === 0}>
                <Download className="mr-2 h-4 w-4"/> Exportar Bracket
            </Button>
            {isAdmin && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" />Eliminar Fase</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Fase: {knockoutStage.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la fase eliminatoria y todos sus datos. No se puede deshacer.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteKnockoutStage(); toast({ title: "Fase Eliminada" });}} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
        </CardHeader>
        {champion && (
            <CardContent>
                <div className="p-4 bg-yellow-400/30 dark:bg-yellow-600/40 border border-yellow-500 rounded-lg text-center">
                    <Trophy className="h-10 w-10 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                    <h3 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300">¡Campeón: {champion.name}!</h3>
                </div>
            </CardContent>
        )}
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Bracket de Eliminatorias</CardTitle></CardHeader>
        <CardContent id="knockout-bracket-export-area" className="bg-card">
          <ScrollArea className="pb-4">
            <div className="flex space-x-8 overflow-x-auto p-4"> {/* Added p-4 for padding during export */}
              {knockoutStage.rounds.map((round, roundIndex) => (
                <div key={round.id} className="flex flex-col items-center space-y-6 min-w-max">
                  <h3 className="text-lg font-semibold text-center sticky top-0 bg-background/80 backdrop-blur-sm py-2 px-4 rounded-md z-10">{round.name}</h3>
                  <div className="space-y-6 relative">
                    {round.matches.map((match, matchIndex) => (
                      <div key={match.id} className="flex items-center">
                        <KnockoutMatchCard 
                          match={match}
                          roundName={round.name}
                          isAdmin={isAdmin}
                          getTeamName={(id) => getTeamById(id)?.name || 'N/A'}
                          onSaveScore={handleSaveKnockoutScore(round.id)}
                          initialScoreA={matchScoresInput[match.id]?.scoreA ?? ''}
                          initialScoreB={matchScoresInput[match.id]?.scoreB ?? ''}
                        />
                        {roundIndex < knockoutStage.rounds.length - 1 && match.played && 
                         knockoutStage.rounds[roundIndex+1] && knockoutStage.rounds[roundIndex+1].matches.some(
                            nextMatch => nextMatch.teamAId === (match.scoreA! > match.scoreB! ? match.teamAId : match.teamBId) || 
                                         nextMatch.teamBId === (match.scoreA! > match.scoreB! ? match.teamAId : match.teamBId)
                         ) && (
                          <div className="w-8 h-px bg-muted-foreground mx-2"></div>
                        )}
                         {roundIndex < knockoutStage.rounds.length - 1 && match.played && 
                            !knockoutStage.rounds[roundIndex+1]?.matches.some(
                                nextMatch => nextMatch.teamAId === (match.scoreA! > match.scoreB! ? match.teamAId : match.teamBId) || 
                                             nextMatch.teamBId === (match.scoreA! > match.scoreB! ? match.teamAId : match.teamBId)
                            ) && knockoutStage.championId !== (match.scoreA! > match.scoreB! ? match.teamAId : match.teamBId) && (
                            <div className="w-8 h-px bg-transparent mx-2"></div> 
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
             {knockoutStage.rounds.length === 0 && <p className="text-muted-foreground text-center py-4">No hay rondas generadas.</p>}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
