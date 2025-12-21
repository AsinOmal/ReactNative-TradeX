import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { ThemeWrapper } from '../src/components/ThemeWrapper';
import { fontAssets, fonts } from '../src/config/fonts';
import { colors } from '../src/config/theme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { PrivacyProvider } from '../src/context/PrivacyContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { TradingProvider } from '../src/context/TradingContext';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = '@tradex_onboarding_complete';
const POST_SIGNUP_ONBOARDING_KEY = '@tradex_post_signup_onboarding_complete';

function AuthenticatedLayout() {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading: authLoading, user, isNewUser, clearIsNewUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isPostSignupOnboardingComplete, setIsPostSignupOnboardingComplete] = useState<boolean | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const previousAuthState = useRef<boolean | null>(null);
  const previousVerificationState = useRef<boolean | null>(null);
  
  // Extra validation: ensure user has a valid UID (not just truthy user object)
  const isAuthValid = isAuthenticated && user?.uid && user?.email;
  
  // Check onboarding status once on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        const postSignupCompleted = await AsyncStorage.getItem(POST_SIGNUP_ONBOARDING_KEY);
        setIsOnboardingComplete(completed === 'true');
        setIsPostSignupOnboardingComplete(postSignupCompleted === 'true');
      } catch (e) {
        setIsOnboardingComplete(false);
        setIsPostSignupOnboardingComplete(false);
      }
    };
    checkOnboarding();
  }, []);
  
  // Handle initial navigation (only runs once after initial auth check)
  useEffect(() => {
    if (authLoading || isOnboardingComplete === null || isPostSignupOnboardingComplete === null || initialCheckDone) return;
    
    setInitialCheckDone(true);
    previousAuthState.current = !!isAuthValid;
    
    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding' || segments[0] === 'welcome-onboarding';
    
    console.log('Initial navigation check:', { isAuthValid, isOnboardingComplete, segment: segments[0], userUid: user?.uid });
    
    // Onboarding not complete
    if (!isOnboardingComplete) {
      router.replace('/welcome-onboarding');
      return;
    }
    
    // User is authenticated with valid credentials
    if (isAuthValid) {
      // 1. Check Email Verification
      if (!user.emailVerified) {
        console.log('User unverified, redirecting to verify-email');
        router.replace('/auth/verify-email');
        return;
      }

      // 2. Check Post-Signup Onboarding
      // If not complete, we must show it. 
      if (!isPostSignupOnboardingComplete) {
         console.log('Incomplete onboarding, navigating to post-signup-onboarding');
         router.replace('/post-signup-onboarding');
         return;
      }

      // 3. Go to Home
      router.replace('/(tabs)');
      return;
    }
    
    // User is not authenticated - go to auth welcome
    if (!inAuthGroup && !inOnboarding) {
      router.replace('/auth/welcome');
    }
  }, [authLoading, isOnboardingComplete, initialCheckDone]);
  
  // Handle auth state changes AFTER initial check (login/logout)
  useEffect(() => {
    // Skip if initial check not done or still loading
    if (!initialCheckDone || authLoading) return;
    
    const currentAuthValid = !!isAuthValid;
    const wasAuthenticated = previousAuthState.current;
    // We default to false if null/undefined for check
    const wasVerified = previousVerificationState.current === true;
    const isNowVerified = user?.emailVerified === true;
    
    // Skip if auth state AND verification state hasn't changed
    if (wasAuthenticated === currentAuthValid && wasVerified === isNowVerified) return;
    
    console.log('Auth/Verify state changed:', { 
      auth: { from: wasAuthenticated, to: currentAuthValid }, 
      verified: { from: wasVerified, to: isNowVerified },
      email: user?.email 
    });
    
    previousAuthState.current = currentAuthValid;
    previousVerificationState.current = isNowVerified;
    
    // User just logged in with valid credentials
    if (currentAuthValid) {
      if (!isNowVerified) {
        console.log('User login unverified, navigating to verify-email');
        router.replace('/auth/verify-email');
        return;
      }

      // If we just became verified (wasVerified=false), treat it like a fresh entry 
      // OR if we just logged in (wasAuthenticated=false).
      // If we are just refreshing state but nothing changed, we returned early above.
      
      if (isNewUser) {
        // New signup - show post-signup onboarding
        console.log('New user signup, navigating to post-signup onboarding');
        clearIsNewUser();
        router.replace('/post-signup-onboarding');
      } else {
        // Returning user login - show welcome back
        console.log('Returning user login, navigating to welcome-back');
        router.replace('/welcome-back');
      }
      return;
    }
    
    // User just logged out (was authenticated, now not)
    if (!currentAuthValid && wasAuthenticated === true) {
      console.log('User logged out, navigating to auth/welcome');
      router.replace('/auth/welcome');
    }
  }, [isAuthValid, initialCheckDone, authLoading, isNewUser, user?.emailVerified]);
  
  // Show loading screen during initial load
  if (authLoading || isOnboardingComplete === null || isPostSignupOnboardingComplete === null) {
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
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/verify-email" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="welcome-onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="post-signup-onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="welcome-back" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="add-month" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="month-details/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemeWrapper>
          <AuthProvider>
            <PrivacyProvider>
              <TradingProvider>
                <AuthenticatedLayout />
              </TradingProvider>
            </PrivacyProvider>
          </AuthProvider>
        </ThemeWrapper>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}


