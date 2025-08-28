'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { themePresets, ThemePreset } from '@/lib/themes/presets'

type ThemeContextType = {
  theme: ThemePreset
  setTheme: (theme: ThemePreset) => void
  themes: ThemePreset[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get theme from environment variable or default to violet
  const getInitialTheme = () => {
    const envTheme = process.env.NEXT_PUBLIC_APP_THEME || 'violet'
    const foundTheme = themePresets.find(t => t.id === envTheme)
    return foundTheme || themePresets[0] // Fallback to violet if env theme not found
  }

  const [theme] = useState<ThemePreset>(getInitialTheme())

  useEffect(() => {
    // Apply theme colors to CSS variables
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case (e.g., primaryForeground -> primary-foreground)
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVarName, value)
    })
  }, [theme])

  const setTheme = () => {
    // Theme is now controlled by environment variable, but keeping this for backwards compatibility
    console.warn('Theme changes are no longer supported. Please set NEXT_PUBLIC_APP_THEME environment variable.')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: themePresets }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
