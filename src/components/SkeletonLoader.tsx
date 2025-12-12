import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton loader with shimmer animation
 * Theme-aware - adapts to dark/light mode
 */
export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}: SkeletonProps) {
  const { isDark } = useTheme();
  const shimmerProgress = useSharedValue(0);
  
  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1, // infinite
      false // don't reverse
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-100, 100]
    );
    
    return {
      transform: [{ translateX }],
    };
  });
  
  const baseColor = isDark ? '#27272A' : '#E4E4E7';
  const shimmerColor = isDark ? '#3F3F46' : '#F4F4F5';
  
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: shimmerColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Skeleton card - pre-styled for card-like content
 */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { isDark } = useTheme();
  
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1F1F23' : '#FFFFFF',
          borderColor: isDark ? '#27272A' : '#E4E4E7',
        },
        style,
      ]}
    >
      <View style={styles.cardContent}>
        <Skeleton width={120} height={14} borderRadius={4} />
        <Skeleton width={80} height={24} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for month cards
 */
export function SkeletonMonthCard() {
  const { isDark } = useTheme();
  
  return (
    <View
      style={[
        styles.monthCard,
        {
          backgroundColor: isDark ? '#1F1F23' : '#FFFFFF',
          borderColor: isDark ? '#27272A' : '#E4E4E7',
        },
      ]}
    >
      <View style={styles.monthCardRow}>
        <View>
          <Skeleton width={100} height={14} borderRadius={4} />
          <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Skeleton width={80} height={20} borderRadius={4} />
          <Skeleton width={50} height={14} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for hero P&L card
 */
export function SkeletonHeroCard() {
  return (
    <View style={styles.heroCard}>
      <Skeleton width={100} height={14} borderRadius={4} />
      <Skeleton width={180} height={40} borderRadius={8} style={{ marginTop: 12 }} />
      <View style={styles.heroStats}>
        <Skeleton width={80} height={16} borderRadius={4} />
        <Skeleton width={80} height={16} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    opacity: 0.3,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardContent: {
    gap: 4,
  },
  monthCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  monthCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroCard: {
    backgroundColor: 'rgba(16, 185, 95, 0.15)',
    borderRadius: 24,
    padding: 24,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
});
