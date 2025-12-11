import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import "../global.css";
import { fontAssets, fonts } from '../src/config/fonts';
import { colors } from '../src/config/theme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { TradingProvider } from '../src/context/TradingContext';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = '@tradex_onboarding_complete';

function AuthenticatedLayout() {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const navigationDone = useRef(false);
  
  // Check onboarding status once on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        setIsOnboardingComplete(completed === 'true');
      } catch (e) {
        setIsOnboardingComplete(false);
      }
    };
    checkOnboarding();
  }, []);
  
  // Handle navigation - only run once per navigation goal
  useEffect(() => {
    // Wait for all data to load
    if (authLoading || isOnboardingComplete === null) return;
    
    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding' || segments[0] === 'welcome-onboarding';
    const inTabs = segments[0] === '(tabs)';
    
    // Onboarding not complete - show welcome-onboarding (only once)
    if (!isOnboardingComplete && !inOnboarding) {
      if (!navigationDone.current) {
        navigationDone.current = true;
        router.replace('/welcome-onboarding');
      }
      return;
    }
    
    // Reset navigation flag when onboarding completes
    if (isOnboardingComplete && navigationDone.current && !inAuthGroup && !inTabs) {
      navigationDone.current = false;
    }
    
    // User is authenticated - go to home
    if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
      return;
    }
    
    // User is not authenticated and not on auth screen - go to welcome
    if (isOnboardingComplete && !isAuthenticated && !inAuthGroup && !inOnboarding) {
      router.replace('/auth/welcome');
      return;
    }
  }, [isAuthenticated, authLoading, isOnboardingComplete, segments]);
  
  // Show loading screen
  if (authLoading || isOnboardingComplete === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.black }]}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingLogo}>TradeX</Text>
          <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.lightBg }]}>
      <Slot />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Wait for fonts
  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.black }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <TradingProvider>
          <AuthenticatedLayout />
        </TradingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingLogo: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    color: colors.primary,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 16,
  },
});
