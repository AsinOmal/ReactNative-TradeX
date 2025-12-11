import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../src/config/fonts';
import { colors } from '../../src/config/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Area - Right Aligned */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="trending-up" size={40} color={colors.primary} />
          </View>
          <Text style={styles.brandName}>TradeX</Text>
          <Text style={styles.tagline}>Track your trading journey</Text>
        </View>
        
        {/* Hero Text */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Master{'\n'}Your{'\n'}Trades
          </Text>
          <Text style={styles.heroSubtitle}>
            "The goal of a successful trader is to make the best trades. Money is secondary."
          </Text>
          <Text style={styles.heroAuthor}>- Alexander Elder</Text>
        </View>
        
        {/* Buttons - Centered */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerButtonText}>Register</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'flex-end',
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 95, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandName: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 56,
    color: colors.primary,
    lineHeight: 60,
    letterSpacing: -2,
    marginBottom: 24,
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    maxWidth: 280,
  },
  heroAuthor: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.white,
    marginTop: 12,
  },
  buttonSection: {
    alignItems: 'center',
    gap: 16,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  loginButtonText: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.white,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
  },
  registerButtonText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.white,
  },
});
