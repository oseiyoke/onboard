export type ThemePreset = {
  id: string
  name: string
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    muted: string
    mutedForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
}

export const themePresets: ThemePreset[] = [
  {
    id: 'violet',
    name: 'Violet',
    colors: {
      primary: '262.1 83.3% 57.8%',
      primaryForeground: '210 40% 98%',
      secondary: '220 14.3% 95.9%',
      secondaryForeground: '220.9 39.3% 11%',
      accent: '220 14.3% 95.9%',
      accentForeground: '220.9 39.3% 11%',
      background: '0 0% 100%',
      foreground: '224 71.4% 4.1%',
      card: '0 0% 100%',
      cardForeground: '224 71.4% 4.1%',
      popover: '0 0% 100%',
      popoverForeground: '224 71.4% 4.1%',
      muted: '220 14.3% 95.9%',
      mutedForeground: '220 8.9% 46.1%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '220 13% 91%',
      input: '220 13% 91%',
      ring: '262.1 83.3% 57.8%',
    },
  },
  {
    id: 'blue',
    name: 'Blue',
    colors: {
      primary: '221.2 83.2% 53.3%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      secondaryForeground: '222.2 84% 4.9%',
      accent: '210 40% 96%',
      accentForeground: '222.2 84% 4.9%',
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 84% 4.9%',
      muted: '210 40% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
    },
  },
  {
    id: 'green',
    name: 'Nigerian Green',
    colors: {
      primary: '157 100% 26%',        // Nigerian flag green (#008751)
      primaryForeground: '0 0% 98%',
      secondary: '157 25% 95%',       // Very light Nigerian green
      secondaryForeground: '157 30% 15%',
      accent: '157 25% 95%',
      accentForeground: '157 30% 15%',
      background: '0 0% 100%',
      foreground: '157 15% 10%',
      card: '0 0% 100%',
      cardForeground: '157 15% 10%',
      popover: '0 0% 100%',
      popoverForeground: '157 15% 10%',
      muted: '157 20% 96%',
      mutedForeground: '157 10% 45%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '157 30% 88%',
      input: '157 30% 88%',
      ring: '157 100% 26%',           // Nigerian flag green for focus rings
    },
  },
  {
    id: 'orange',
    name: 'Orange',
    colors: {
      primary: '20.5 90.2% 48.2%',
      primaryForeground: '60 9.1% 97.8%',
      secondary: '33 100% 96.5%',
      secondaryForeground: '20 14.3% 4.1%',
      accent: '33 100% 96.5%',
      accentForeground: '20 14.3% 4.1%',
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      cardForeground: '20 14.3% 4.1%',
      popover: '0 0% 100%',
      popoverForeground: '20 14.3% 4.1%',
      muted: '33 100% 96.5%',
      mutedForeground: '30 5% 42%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '27 96% 90%',
      input: '27 96% 90%',
      ring: '20.5 90.2% 48.2%',
    },
  },
  {
    id: 'red',
    name: 'Red',
    colors: {
      primary: '0 84.2% 60.2%',
      primaryForeground: '210 40% 98%',
      secondary: '0 85.7% 97.3%',
      secondaryForeground: '0 8.5% 3.9%',
      accent: '0 85.7% 97.3%',
      accentForeground: '0 8.5% 3.9%',
      background: '0 0% 100%',
      foreground: '0 8.5% 3.9%',
      card: '0 0% 100%',
      cardForeground: '0 8.5% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '0 8.5% 3.9%',
      muted: '0 85.7% 97.3%',
      mutedForeground: '0 5% 42%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '0 93% 90%',
      input: '0 93% 90%',
      ring: '0 84.2% 60.2%',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    colors: {
      primary: '222.2 84% 4.9%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      secondaryForeground: '222.2 84% 4.9%',
      accent: '210 40% 96%',
      accentForeground: '222.2 84% 4.9%',
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 84% 4.9%',
      muted: '210 40% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '222.2 84% 4.9%',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    colors: {
      primary: '346.8 77.2% 49.8%',
      primaryForeground: '355.7 100% 97.3%',
      secondary: '355 100% 97.3%',
      secondaryForeground: '355.7 100% 4.7%',
      accent: '355 100% 97.3%',
      accentForeground: '355.7 100% 4.7%',
      background: '0 0% 100%',
      foreground: '355.7 100% 4.7%',
      card: '0 0% 100%',
      cardForeground: '355.7 100% 4.7%',
      popover: '0 0% 100%',
      popoverForeground: '355.7 100% 4.7%',
      muted: '355 100% 97.3%',
      mutedForeground: '350 4% 42%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '356 100% 90%',
      input: '356 100% 90%',
      ring: '346.8 77.2% 49.8%',
    },
  },
  {
    id: 'zinc',
    name: 'Zinc',
    colors: {
      primary: '240 5.9% 10%',
      primaryForeground: '0 0% 98%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 5.9% 10%',
    },
  },
]
