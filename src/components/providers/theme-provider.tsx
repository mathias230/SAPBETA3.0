"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { useTournamentStore } from "@/lib/store"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const storeTheme = useTournamentStore((state) => state.theme)
  const storeSetTheme = useTournamentStore((state) => state.setTheme)

  React.useEffect(() => {
    // Sync store theme with next-themes if they diverge (e.g. on initial load from localStorage)
    if (props.forcedTheme !== storeTheme && props.defaultTheme !== storeTheme) {
       // This logic might need refinement depending on how system theme is handled by next-themes
    }
  }, [storeTheme, props.forcedTheme, props.defaultTheme]);


  return <NextThemesProvider 
            {...props} 
            // forcedTheme={storeTheme === 'system' ? undefined : storeTheme} // Allow system theme to work
            // onThemeChange={(theme) => storeSetTheme(theme as 'light' | 'dark' | 'system')}
          >
            {children}
          </NextThemesProvider>
}
