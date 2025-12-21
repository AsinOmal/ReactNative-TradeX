import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme as useRNColorScheme, View } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setThemeState] = useState<Theme>('dark');
  
  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);
  
  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      } else {
        // Default to dark or system preference if available
        setThemeState('dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setThemeState('dark');
    } finally {
      setIsLoaded(true);
    }
  };
  
  const setTheme = (newTheme: Theme) => {
    // Update state immediately for instant UI response
    setThemeState(newTheme);
    
    // Save to storage asynchronously (fire and forget)
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch((error) => {
      console.error('Error saving theme:', error);
    });
  };
  
  const toggleTheme = () => {
    // Toggle based on current state
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  const value: ThemeContextType = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };
  
  // Show loading spinner while theme loads
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
