import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../src/config/fonts';
import { useAuth } from '../src/context/AuthContext';
import { useTrading } from '../src/context/TradingContext';
import { fontScale, scale } from '../src/utils/scaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeBack() {
  const router = useRouter();
  const { user } = useAuth();
  const { months, trades } = useTrading();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  
  // Dot animations (sequential)
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  // Get display name
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Trader';
  const firstName = displayName.split(' ')[0];
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sequential dot animation
    const animateDot = (anim: Animated.Value) => 
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ]);

    Animated.loop(
      Animated.stagger(200, [
        animateDot(dot1Anim),
        animateDot(dot2Anim),
        animateDot(dot3Anim),
      ])
    ).start();
  }, []);

  // Navigate after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={['#0A0A0A', '#111111', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative gradient orbs */}
      <Animated.View style={[styles.orb, styles.orb1, { opacity: glowAnim }]} />
      <Animated.View style={[styles.orb, styles.orb2, { opacity: glowAnim }]} />

      {/* Main Content */}
      <View style={styles.content}>
        
        {/* App Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.appIcon}
          />
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{capitalizedName}</Text>
          <Text style={styles.subtitle}>Ready to track your trades</Text>
        </Animated.View>

        {/* Stats Preview (if data loaded) */}
        {months.length > 0 && (
          <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{months.length}</Text>
              <Text style={styles.statLabel}>Months</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{trades.length}</Text>
              <Text style={styles.statLabel}>Trades</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Bottom Section - Pulsing Dots */}
      <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    backgroundColor: '#10B95F',
    top: -SCREEN_WIDTH * 0.3,
    left: -SCREEN_WIDTH * 0.2,
    opacity: 0.15,
  },
  orb2: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    backgroundColor: '#10B95F',
    bottom: -SCREEN_WIDTH * 0.2,
    right: -SCREEN_WIDTH * 0.2,
    opacity: 0.1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  iconContainer: {
    marginBottom: scale(40),
    shadowColor: '#10B95F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  appIcon: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(24),
  },
  textContainer: {
    alignItems: 'center',
  },
  greeting: {
    fontFamily: fonts.medium,
    fontSize: fontScale(16),
    color: '#71717A',
    marginBottom: scale(4),
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: fontScale(38),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontScale(16),
    color: '#52525B',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(40),
    paddingHorizontal: scale(32),
    paddingVertical: scale(16),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: scale(24),
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: fontScale(24),
    color: '#10B95F',
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: fontScale(12),
    color: '#71717A',
    marginTop: scale(4),
  },
  statDivider: {
    width: 1,
    height: scale(32),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bottomSection: {
    paddingHorizontal: scale(40),
    paddingBottom: scale(60),
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: scale(8),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#10B95F',
  },
});
