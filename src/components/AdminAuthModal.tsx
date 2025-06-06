
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminAuthModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogin: (password: string) => void;
}

export default function AdminAuthModal({ isOpen, setIsOpen, onLogin }: AdminAuthModalProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acceso de Administrador</DialogTitle>
          <DialogDescription>Ingresa la contraseña de administrador para gestionar el torneo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password_admin" className="text-right">
                Contraseña
              </Label>
              <Input
                id="password_admin"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit">Ingresar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
