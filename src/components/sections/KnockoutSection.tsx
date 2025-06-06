
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GitFork } from 'lucide-react';

export default function KnockoutSection() {
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
          <p className="text-muted-foreground">Las funciones de la fase eliminatoria están en construcción.</p>
          <p className="text-sm text-muted-foreground/80">¡Pronto podrás crear llaves, seguir partidos y coronar a tu campeón aquí!</p>
        </div>
      </CardContent>
    </Card>
  );
}
