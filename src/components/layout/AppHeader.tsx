"use client";

import React, { useState } from 'react';
import { Moon, Sun, Lock, Unlock, ShieldCheck, Settings2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTournamentStore } from '@/lib/store';
import AdminAuthModal from '@/components/AdminAuthModal';
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


export default function AppHeader() {
  const { setTheme, theme } = useTheme();
  const isAdmin = useTournamentStore((state) => state.isAdmin);
  const login = useTournamentStore((state) => state.login);
  const logout = useTournamentStore((state) => state.logout);
  const resetTournament = useTournamentStore((state) => state.resetTournament);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toast } = useToast();

  const handleLogin = (password: string) => {
    if (login(password)) {
      setIsAuthModalOpen(false);
      toast({ title: "Admin Mode Activated", description: "You now have full access." });
    } else {
      toast({ title: "Login Failed", description: "Incorrect password.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Admin Mode Deactivated" });
  };
  
  const handleReset = () => {
    resetTournament();
    toast({ title: "Tournament Reset", description: "All data has been cleared." });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <ShieldCheck className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-2xl font-bold font-headline">
            SAP <span className="text-sm font-normal text-muted-foreground">Tournament Trackr</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                {theme === 'light' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAdmin ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/10">
                  <Unlock className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">Admin Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <Unlock className="mr-2 h-4 w-4" />
                  <span>Logout Admin</span>
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Settings2 className="mr-2 h-4 w-4" />
                       <span>Reset Tournament</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Tournament Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All teams, groups, league progress, and knockout stages will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Reset Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="icon" onClick={() => setIsAuthModalOpen(true)}>
              <Lock className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Login as Admin</span>
            </Button>
          )}
        </div>
      </div>
      <AdminAuthModal isOpen={isAuthModalOpen} setIsOpen={setIsAuthModalOpen} onLogin={handleLogin} />
    </header>
  );
}
