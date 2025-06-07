
"use client";

import React from 'react';
import { useTournamentStore } from '@/lib/store';
import type { ArchivedWinner } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award, Trash2, CalendarDays } from 'lucide-react';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export default function HistorySection() {
  const { isAdmin, getArchivedWinners, deleteArchivedWinner, getTeamById } = useTournamentStore();
  const archivedWinners = getArchivedWinners();
  const { toast } = useToast();

  const handleDeleteWinner = (winnerId: string, tournamentName: string) => {
    deleteArchivedWinner(winnerId);
    toast({
      title: "Entrada Eliminada",
      description: `La entrada para "${tournamentName}" ha sido eliminada del historial.`,
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <Award className="mr-2 h-6 w-6 text-yellow-500" /> Historial de Campeones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {archivedWinners.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <CalendarDays className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aún no hay campeones archivados.</p>
            {isAdmin && <p className="text-sm text-muted-foreground/80">Puedes archivar campeones desde las secciones de Liga y Eliminatorias.</p>}
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(100vh-300px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                  <TableHead className="font-semibold">Nombre del Torneo</TableHead>
                  <TableHead className="font-semibold">Campeón</TableHead>
                  <TableHead className="font-semibold text-center">Tipo</TableHead>
                  <TableHead className="font-semibold text-center">Fecha de Archivo</TableHead>
                  {isAdmin && <TableHead className="font-semibold text-right w-24">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedWinners.map((winner) => (
                  <TableRow key={winner.id}>
                    <TableCell className="font-medium">{winner.tournamentName}</TableCell>
                    <TableCell>{winner.championTeamName || getTeamById(winner.championTeamId)?.name || 'Equipo Desconocido'}</TableCell>
                    <TableCell className="text-center">{winner.type}</TableCell>
                    <TableCell className="text-center">
                      {format(new Date(winner.dateArchived), "dd MMM yyyy, HH:mm", { locale: es })}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar del Historial?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que quieres eliminar la entrada de "{winner.tournamentName}" (Campeón: {winner.championTeamName}) del historial? Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteWinner(winner.id, winner.tournamentName)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground border-t pt-4">
        {archivedWinners.length} entrada{archivedWinners.length === 1 ? '' : 's'} en el historial.
      </CardFooter>
    </Card>
  );
}
