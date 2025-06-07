
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Archive } from 'lucide-react';

interface ArchiveWinnerDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  defaultTournamentName: string;
  championName: string;
  onArchive: (tournamentName: string) => void;
}

export default function ArchiveWinnerDialog({
  isOpen,
  setIsOpen,
  defaultTournamentName,
  championName,
  onArchive,
}: ArchiveWinnerDialogProps) {
  const [tournamentNameInput, setTournamentNameInput] = useState(defaultTournamentName);

  useEffect(() => {
    if (isOpen) {
      setTournamentNameInput(defaultTournamentName);
    }
  }, [isOpen, defaultTournamentName]);

  const handleSubmit = () => {
    if (tournamentNameInput.trim()) {
      onArchive(tournamentNameInput.trim());
      setIsOpen(false); // Close dialog on successful archive
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Archive className="mr-2 h-5 w-5 text-yellow-500" /> Archivar Campeón: {championName}
          </DialogTitle>
          <DialogDescription>
            Ingresa un nombre para esta edición del torneo. El campeón '{championName}' será añadido al historial.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="tournament-edition-name" className="text-sm font-medium">
            Nombre de la Edición del Torneo
          </Label>
          <Input
            id="tournament-edition-name"
            value={tournamentNameInput}
            onChange={(e) => setTournamentNameInput(e.target.value)}
            placeholder="Ej: Liga de Verano 2024, Copa Anual"
            autoFocus
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={!tournamentNameInput.trim()}>
            Archivar Campeón
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
