import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemePreset = {
  id: string;
  name: string;
  color: string;
  strokeColor: string;
  secondary: string;
  accent: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'mefisa-azul',
    name: 'Azul Mefisa (Oficial)',
    color: '#002172',
    strokeColor: 'rgba(0, 33, 114, 0.45)',
    secondary: '#2A657E',
    accent: '#91CA0C',
  },
  {
    id: 'mefisa-verde',
    name: 'Verde Especialidades',
    color: '#91CA0C',
    strokeColor: 'rgba(145, 202, 12, 0.55)',
    secondary: '#002172',
    accent: '#2A657E',
  },
  {
    id: 'mefisa-oceano',
    name: 'Oceano Terapêutico',
    color: '#2A657E',
    strokeColor: 'rgba(42, 101, 126, 0.5)',
    secondary: '#002172',
    accent: '#91CA0C',
  },
];

interface ThemeContextType {
  activePreset: ThemePreset;
  setThemePreset: (presetId: string) => void;
  enableStrokeEffect: boolean;
  setEnableStrokeEffect: (enabled: boolean) => void;
  getThemeStrokeStyle: (type?: 'text' | 'icon' | 'badge') => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePreset, setActivePreset] = useState<ThemePreset>(THEME_PRESETS[0]);
  const [enableStrokeEffect, setEnableStrokeEffect] = useState<boolean>(true);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-color', activePreset.color);
    root.style.setProperty('--theme-stroke-color', activePreset.strokeColor);
    root.style.setProperty('--mefisa-secondary', activePreset.secondary);
    root.style.setProperty('--mefisa-tertiary', activePreset.accent);
  }, [activePreset]);

  const setThemePreset = (presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setActivePreset(found);
    }
  };

  const getThemeStrokeStyle = (type: 'text' | 'icon' | 'badge' = 'text'): string => {
    if (!enableStrokeEffect) return '';
    if (type === 'text') return 'theme-stroke-text';
    if (type === 'icon') return 'theme-stroke-icon';
    if (type === 'badge') return 'theme-stroke-badge';
    return '';
  };

  return (
    <ThemeContext.Provider
      value={{
        activePreset,
        setThemePreset,
        enableStrokeEffect,
        setEnableStrokeEffect,
        getThemeStrokeStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
