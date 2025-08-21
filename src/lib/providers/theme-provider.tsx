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
  const [theme, setThemeState] = useState<ThemePreset>(themePresets[0]) // Default to violet

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('onboard-theme')
    if (savedTheme) {
      const foundTheme = themePresets.find(t => t.id === savedTheme)
      if (foundTheme) {
        setThemeState(foundTheme)
      }
    }
  }, [])

  useEffect(() => {
    // Apply theme colors to CSS variables
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case (e.g., primaryForeground -> primary-foreground)
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVarName, value)
    })
  }, [theme])

  const setTheme = (newTheme: ThemePreset) => {
    setThemeState(newTheme)
    localStorage.setItem('onboard-theme', newTheme.id)
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
