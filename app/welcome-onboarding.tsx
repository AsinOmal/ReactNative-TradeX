import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { fonts } from '../src/config/fonts';
import { colors } from '../src/config/theme';

export default function WelcomeOnboardingScreen() {
  const router = useRouter();
  
  const handleContinue = () => {
    router.replace('/onboarding');
  };
  
  return (
    <View style={styles.container}>
      {/* Centered Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="flash" size={60} color={colors.primary} />
        </View>
        
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>TradeX</Text>
        <Text style={styles.tagline}>Your personal trading journal</Text>
      </View>
      
      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 95, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  appName: {
    fontFamily: fonts.extraBold,
    fontSize: 52,
    color: colors.white,
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  continueButtonText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.white,
  },
});
