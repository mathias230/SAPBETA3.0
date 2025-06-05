"use client";

import { useTournamentStore } from '@/lib/store';

export function useIsAdmin() {
  const isAdmin = useTournamentStore((state) => state.isAdmin);
  return isAdmin;
}
