"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

export default function LeagueSection() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
           <ListChecks className="mr-2 h-6 w-6 text-primary" /> League Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <ListChecks className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">League management features are under construction.</p>
          <p className="text-sm text-muted-foreground/80">Soon you'll be able to configure leagues, generate schedules, and track standings!</p>
        </div>
      </CardContent>
    </Card>
  );
}
