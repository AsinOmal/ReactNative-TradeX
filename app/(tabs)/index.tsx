import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { MonthCard } from '../../src/components/MonthCard';
import { PrivacyAwareText } from '../../src/components/PrivacyAwareText';
import { Skeleton, SkeletonHeroCard, SkeletonMonthCard } from '../../src/components/SkeletonLoader';
import { fonts } from '../../src/config/fonts';
import { useAuth } from '../../src/context/AuthContext';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { MonthRecord } from '../../src/types';
import { formatMonthDisplay, getMonthKey } from '../../src/utils/dateUtils';
import { formatCurrency, formatPercentage } from '../../src/utils/formatters';
import { fontScale, scale } from '../../src/utils/scaling';

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Get user's display name with fallback to email-based name
const getUserName = (displayName: string | undefined, email: string | null | undefined) => {
  // Priority: displayName > email-based name > "Trader"
  if (displayName && displayName.trim()) return displayName;
  if (!email) return 'Trader';
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// Streak Modal Component
const StreakModal = ({ 
  visible, 
  onClose, 
  streak, 
  streakMonths, 
  isDark 
}: { 
  visible: boolean; 
  onClose: () => void; 
  streak: number; 
  streakMonths: MonthRecord[];
  isDark: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Continuous fire rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);
  
  const totalStreakGains = streakMonths.reduce((sum, m) => sum + m.netProfitLoss, 0);
  
  const fireRotate = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-5deg', '5deg', '-5deg'],
  });
  
  const themeColors = {
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    card: isDark ? '#1F1F23' : '#FFFFFF',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: scale(20) }}>
        <Animated.View 
          style={{ 
            width: '100%',
            maxWidth: scale(360),
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          }}
        >
          {/* Modal Card */}
          <LinearGradient
            colors={['#FFB800', '#FF8C00', '#FF6B00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: scale(28), overflow: 'hidden' }}
          >
            {/* Decorative elements */}
            <View style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <View style={{ position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ position: 'absolute', top: scale(100), right: scale(20), width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            
            {/* Close button */}
            <TouchableOpacity 
              onPress={onClose}
              style={{ position: 'absolute', top: scale(16), right: scale(16), zIndex: 10, width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name="close" size={scale(20)} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={{ padding: scale(28), alignItems: 'center' }}>
              {/* Fire Animation */}
              <Animated.View style={{ transform: [{ rotate: fireRotate }], marginBottom: scale(16) }}>
                <View style={{ width: scale(100), height: scale(100), borderRadius: scale(50), backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20 }}>
                  <Text style={{ fontSize: fontScale(56) }}>🔥</Text>
                </View>
              </Animated.View>
              
              {/* Title */}
              <Text style={{ fontFamily: fonts.extraBold, fontSize: fontScale(32), color: '#FFFFFF', textAlign: 'center', marginBottom: scale(4) }}>
                {streak} Month Streak!
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: scale(24) }}>
                You're on fire! Keep it up 💪
              </Text>
              
              {/* Stats Row */}
              <View style={{ flexDirection: 'row', width: '100%', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: scale(16), paddingVertical: scale(20), paddingHorizontal: scale(12), marginBottom: scale(20) }}>
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: scale(8) }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: 'rgba(255,255,255,0.75)', marginBottom: scale(6), letterSpacing: 0.5 }}>Total Gains</Text>
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(totalStreakGains, true)}</Text>
                </View>
                <View style={{ width: 1, marginVertical: scale(4), backgroundColor: 'rgba(255,255,255,0.25)' }} />
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: scale(8) }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: 'rgba(255,255,255,0.75)', marginBottom: scale(6), letterSpacing: 0.5 }}>Avg/Month</Text>
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(totalStreakGains / streak, true)}</Text>
                </View>
              </View>
              
              {/* Streak Months List */}
              <View style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: scale(16), padding: scale(4) }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: 'rgba(255,255,255,0.8)', marginLeft: scale(12), marginTop: scale(12), marginBottom: scale(8) }}>WINNING MONTHS</Text>
                {streakMonths.map((month, index) => (
                  <Animated.View 
                    key={month.id} 
                    style={{ 
                      transform: [{ translateY: slideAnim }],
                      opacity: fadeAnim,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: scale(12), padding: scale(12), marginHorizontal: scale(8), marginBottom: scale(8) }}>
                      <View style={{ width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: '#10B95F', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }}>
                        <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(14), color: '#FFFFFF' }}>{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: '#FFFFFF' }}>{formatMonthDisplay(month.month)}</Text>
                      </View>
                      <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(16), color: '#047857' }}>+{formatCurrency(month.netProfitLoss)}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
              
              {/* Motivational Footer */}
              <View style={{ marginTop: scale(20), paddingHorizontal: scale(12) }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontStyle: 'italic' }}>
                  "Consistency is the key to success. You're proving it!" 🏆
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { months, stats, isLoading, loadMonths, getRecentMonths, displayName } = useTrading();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { togglePrivacyMode } = usePrivacy();
  const [refreshing, setRefreshing] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  
  const recentMonths = getRecentMonths(3);
  const currentMonthKey = getMonthKey();
  const currentMonth = months.find(m => m.month === currentMonthKey);
  
  // Calculate profit streak and get streak months
  const getStreakData = () => {
    const sortedMonths = [...months]
      .filter(m => m.status === 'closed')
      .sort((a, b) => b.month.localeCompare(a.month));
    
    const streakMonths: MonthRecord[] = [];
    for (const month of sortedMonths) {
      if (month.netProfitLoss > 0) {
        streakMonths.push(month);
      } else {
        break;
      }
    }
    return { streak: streakMonths.length, streakMonths: streakMonths.reverse() };
  };
  
  const { streak, streakMonths } = getStreakData();
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadMonths();
    setRefreshing(false);
  }, [loadMonths]);
  
  const themeColors = {
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    card: isDark ? '#1F1F23' : '#FFFFFF',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    primary: '#10B95F',
    border: isDark ? '#27272A' : '#E4E4E7',
  };
  
  if (isLoading && months.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: themeColors.bg }}>
        <View style={{ paddingHorizontal: scale(20), paddingTop: scale(16), paddingBottom: scale(20) }}>
          <Skeleton width={120} height={16} borderRadius={4} />
          <Skeleton width={180} height={32} borderRadius={6} style={{ marginTop: scale(8) }} />
        </View>
        
        {/* Hero Card Skeleton */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
          <SkeletonHeroCard />
        </View>
        
        {/* Month Cards Skeleton */}
        <View style={{ paddingHorizontal: scale(20) }}>
          <Skeleton width={140} height={18} borderRadius={4} style={{ marginBottom: scale(16) }} />
          <SkeletonMonthCard />
          <SkeletonMonthCard />
          <SkeletonMonthCard />
        </View>
      </SafeAreaView>
    );
  }
  
  if (months.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: themeColors.bg }}>
        <View style={{ paddingHorizontal: scale(20), paddingTop: scale(16) }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: themeColors.textMuted }}>{getGreeting()}</Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(28), color: themeColors.text, marginTop: scale(4) }}>{getUserName(displayName, user?.email)}</Text>
        </View>
        <EmptyState
          title="Start Tracking"
          message="Add your first month to start tracking your trading performance"
          actionLabel="Add First Month"
          onAction={() => router.push('/add-month')}
          icon="📈"
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: themeColors.bg }}>
      {/* Streak Modal */}
      <StreakModal 
        visible={showStreakModal} 
        onClose={() => setShowStreakModal(false)} 
        streak={streak}
        streakMonths={streakMonths}
        isDark={isDark}
      />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: scale(140) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B95F" />
        }
      >
        {/* Header - Personalized Greeting */}
        <View style={{ paddingHorizontal: scale(20), paddingTop: scale(16), paddingBottom: scale(20) }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: themeColors.textMuted }}>{getGreeting()}</Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(28), color: themeColors.text, marginTop: scale(4) }}>{getUserName(displayName, user?.email)} 👋</Text>
        </View>
        
        {/* Hero P&L Card */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
          <LinearGradient
            colors={stats.totalProfitLoss >= 0 ? ['#10B95F', '#059669'] : ['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: scale(24), padding: scale(24), overflow: 'hidden' }}
          >
            {/* Decorative circles */}
            <View style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            
            <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: 'rgba(255,255,255,0.8)', marginBottom: scale(4) }}>Total P&L</Text>
            <TouchableOpacity onLongPress={togglePrivacyMode} activeOpacity={0.8}>
              <PrivacyAwareText 
                value={stats.totalProfitLoss}
                format={(val) => formatCurrency(val, true)}
                style={{ fontFamily: fonts.extraBold, fontSize: fontScale(42), color: '#FFFFFF', marginBottom: scale(16) }} 
                maskedValue="••••••••"
              />
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', gap: scale(24) }}>
              <View>
                <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: 'rgba(255,255,255,0.7)' }}>Win Rate</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }}>{stats.winRate.toFixed(0)}%</Text>
              </View>
              <View>
                <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: 'rgba(255,255,255,0.7)' }}>Avg Return</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }}>{formatPercentage(stats.averageReturn, true)}</Text>
              </View>
              <View>
                <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: 'rgba(255,255,255,0.7)' }}>Months</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }}>{stats.totalMonths}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        
        {/* Streak Badge (if any) - Now Tappable */}
        {streak > 0 && (
          <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
            <TouchableOpacity 
              onPress={() => setShowStreakModal(true)}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 184, 0, 0.15)', borderRadius: scale(16), padding: scale(16), gap: scale(12) }}
            >
              <View style={{ width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: '#FFB800', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: fontScale(22) }}>🔥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text }}>{streak} Month Profit Streak!</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(13), color: themeColors.textMuted }}>Tap to see details</Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(20)} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Quick Actions */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: scale(24) }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: scale(12) }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: scale(12) }}>
            <TouchableOpacity 
              onPress={() => router.push('/add-month')}
              style={{ flex: 1, backgroundColor: themeColors.card, borderRadius: scale(16), padding: scale(16), alignItems: 'center', gap: scale(8), borderWidth: 1, borderColor: themeColors.border }}
            >
              <View style={{ width: scale(44), height: scale(44), borderRadius: scale(12), backgroundColor: 'rgba(16, 185, 95, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="add-circle" size={scale(24)} color="#10B95F" />
              </View>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.text }}>Add Month</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/analytics')}
              style={{ flex: 1, backgroundColor: themeColors.card, borderRadius: scale(16), padding: scale(16), alignItems: 'center', gap: scale(8), borderWidth: 1, borderColor: themeColors.border }}
            >
              <View style={{ width: scale(44), height: scale(44), borderRadius: scale(12), backgroundColor: 'rgba(99, 102, 241, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="bar-chart" size={scale(24)} color="#6366F1" />
              </View>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.text }}>Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/calendar')}
              style={{ flex: 1, backgroundColor: themeColors.card, borderRadius: scale(16), padding: scale(16), alignItems: 'center', gap: scale(8), borderWidth: 1, borderColor: themeColors.border }}
            >
              <View style={{ width: scale(44), height: scale(44), borderRadius: scale(12), backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="calendar" size={scale(24)} color="#FBBF24" />
              </View>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.text }}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Current Month or Add Current Month */}
        {currentMonth ? (
          <View style={{ paddingHorizontal: scale(20), marginBottom: scale(24) }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: scale(12) }}>
              This Month
            </Text>
            <MonthCard 
              month={currentMonth} 
              showFullDetails 
              onPress={() => router.push(`/month-details/${currentMonth.id}`)}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: scale(20), marginBottom: scale(24) }}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push('/add-month')}
            >
              <LinearGradient
                colors={isDark ? ['rgba(16, 185, 95, 0.1)', 'rgba(16, 185, 95, 0.05)'] : ['rgba(16, 185, 95, 0.12)', 'rgba(16, 185, 95, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ 
                  borderRadius: scale(20), 
                  padding: scale(2),
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 95, 0.2)',
                  borderStyle: 'dashed'
                }}
              >
                  <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: scale(18),
                      gap: scale(12)
                  }}>
                    <View style={{ 
                        width: scale(40), 
                        height: scale(40), 
                        borderRadius: scale(20), 
                        backgroundColor: '#10B95F', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        shadowColor: "#10B95F",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4
                    }}>
                        <Ionicons name="add" size={scale(24)} color="#FFFFFF" />
                    </View>
                    <View>
                        <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(16), color: themeColors.text }}>
                            Add {formatMonthDisplay(currentMonthKey)} Data
                        </Text>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>
                            Track your performance
                        </Text>
                    </View>
                  </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Recent Performance */}
        {recentMonths.length > 0 && (
          <View style={{ paddingHorizontal: scale(20) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12) }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                Recent Performance
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: themeColors.primary }}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentMonths.map(month => (
              <View key={month.id} style={{ marginBottom: scale(12) }}>
                <MonthCard
                  month={month}
                  onPress={() => router.push(`/month-details/${month.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
