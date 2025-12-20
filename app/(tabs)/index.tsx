import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AIInsightsModal } from '../../src/components/AIInsightsModal';
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
                  <Ionicons name="flame" size={scale(56)} color="#FF6B00" />
                </View>
              </Animated.View>
              
              {/* Title */}
              <Text style={{ fontFamily: fonts.extraBold, fontSize: fontScale(32), color: '#FFFFFF', textAlign: 'center', marginBottom: scale(4) }}>
                {streak} Month Streak!
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: scale(24) }}>
                You're on fire! Keep it up!
              </Text>
              
              {/* Stats Row */}
              <View style={{ flexDirection: 'row', width: '100%', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: scale(16), paddingVertical: scale(20), paddingHorizontal: scale(12), marginBottom: scale(20) }}>
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: scale(8) }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: 'rgba(255,255,255,0.75)', marginBottom: scale(6), letterSpacing: 0.5 }}>Total Gains</Text>
                  <PrivacyAwareText value={totalStreakGains} format={(val) => formatCurrency(val, true)} style={{ fontFamily: fonts.bold, fontSize: fontScale(16), color: '#FFFFFF' }} maskedValue="••••••" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} />
                </View>
                <View style={{ width: 1, marginVertical: scale(4), backgroundColor: 'rgba(255,255,255,0.25)' }} />
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: scale(8) }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: 'rgba(255,255,255,0.75)', marginBottom: scale(6), letterSpacing: 0.5 }}>Avg/Month</Text>
                  <PrivacyAwareText value={totalStreakGains / streak} format={(val) => formatCurrency(val, true)} style={{ fontFamily: fonts.bold, fontSize: fontScale(16), color: '#FFFFFF' }} maskedValue="••••••" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} />
                </View>
              </View>
              
              {/* Streak Months List */}
              <View style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: scale(16), padding: scale(4), maxHeight: scale(200) }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: 'rgba(255,255,255,0.8)', marginLeft: scale(12), marginTop: scale(12), marginBottom: scale(8) }}>WINNING MONTHS</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  nestedScrollEnabled
                  style={{ maxHeight: scale(150) }}
                >
                  {streakMonths.slice(0, 6).map((month, index) => (
                    <Animated.View 
                      key={month.id} 
                      style={{ 
                        transform: [{ translateY: slideAnim }],
                        opacity: fadeAnim,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: scale(12), padding: scale(12), marginHorizontal: scale(8), marginBottom: scale(8) }}>
                        <View style={{ width: scale(28), height: scale(28), borderRadius: scale(14), backgroundColor: '#10B95F', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }}>
                          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(12), color: '#FFFFFF' }}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: '#FFFFFF' }}>{formatMonthDisplay(month.month)}</Text>
                        </View>
                        <PrivacyAwareText value={month.netProfitLoss} format={(val) => `+${formatCurrency(val)}`} style={{ fontFamily: fonts.bold, fontSize: fontScale(14), color: '#047857' }} maskedValue="+••••" />
                      </View>
                    </Animated.View>
                  ))}
                  {streakMonths.length > 6 && (
                    <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: scale(8) }}>
                      +{streakMonths.length - 6} more months
                    </Text>
                  )}
                </ScrollView>
              </View>
              
              {/* Motivational Footer */}
              <View style={{ marginTop: scale(20), paddingHorizontal: scale(12) }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontStyle: 'italic' }}>
Consistency is the key to success. You're proving it!
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
  const { months, stats, isLoading, loadMonths, getRecentMonths, trades, getTradesByMonth } = useTrading();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const [refreshing, setRefreshing] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  
  // Typing animation state
  const [typedGreeting, setTypedGreeting] = useState('');
  const greetingFadeAnim = useRef(new Animated.Value(0)).current;
  const greetingPrefix = `${getGreeting()}, `;
  // Use Firebase Auth displayName (set during onboarding)
  const userName = getUserName(user?.displayName ?? undefined, user?.email);
  const fullGreeting = `${greetingPrefix}${userName}!`;
  
  // Typing animation effect
  useEffect(() => {
    setTypedGreeting('');
    let charIndex = 0;
    
    // Start fade in
    Animated.timing(greetingFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    // Type out the greeting
    const typingInterval = setInterval(() => {
      if (charIndex < fullGreeting.length) {
        setTypedGreeting(fullGreeting.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 80);
    
    return () => clearInterval(typingInterval);
  }, [user?.displayName, user?.email]);
  
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
  
  // Auto-start tour for first-time users

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
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
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
  
  // Removed empty state - home now shows with empty values and coach marks
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Streak Modal */}
      <StreakModal 
        visible={showStreakModal} 
        onClose={() => setShowStreakModal(false)} 
        streak={streak}
        streakMonths={streakMonths}
        isDark={isDark}
      />
      
      {/* AI Insights Modal */}
      <AIInsightsModal
        visible={showAIInsights}
        onClose={() => setShowAIInsights(false)}
      />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: scale(140) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B95F" />
        }
      >
        {/* Header - Premium Personalized Design */}
        <View style={{ paddingHorizontal: scale(20), paddingTop: scale(12), paddingBottom: scale(24) }}>
          {/* Top Row - Date and Theme Toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scale(8) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
              <View style={{ width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: '#10B95F' }} />
              <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            
            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(4) }}>
              {/* Theme Toggle */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleTheme();
                }}
                style={{
                  width: scale(40),
                  height: scale(40),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isDark ? 'sunny' : 'moon'} 
                  size={scale(24)} 
                  color={isDark ? '#FCD34D' : '#6366F1'} 
                />
              </TouchableOpacity>
              
              {/* Settings Button */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/settings');
                }}
                style={{
                  width: scale(40),
                  height: scale(40),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="settings-outline" 
                  size={scale(22)} 
                  color={themeColors.textMuted} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Greeting Section - Animated */}
          <View key={`greeting-${isDark}`} style={{ height: fontScale(50), justifyContent: 'flex-start' }}>
            <Animated.View style={{ opacity: greetingFadeAnim }}>
              <Text 
                style={{ fontFamily: fonts.bold, fontSize: fontScale(24), color: themeColors.text, lineHeight: fontScale(32) }}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {typedGreeting.length <= greetingPrefix.length ? (
                  typedGreeting
                ) : (
                  <>
                    {greetingPrefix}
                    <Text style={{ color: '#10B95F' }}>
                      {typedGreeting.slice(greetingPrefix.length)}
                    </Text>
                  </>
                )}
                <Text style={{ color: '#10B95F', opacity: typedGreeting.length < fullGreeting.length ? 1 : 0 }}>|</Text>
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* Getting Started - Show when no months AND no trades */}
        {months.length === 0 && trades.length === 0 && (
          <View style={{ paddingHorizontal: scale(20), marginBottom: scale(24) }}>
            <LinearGradient
              colors={isDark ? ['rgba(16, 185, 95, 0.12)', 'rgba(16, 185, 95, 0.03)'] : ['rgba(16, 185, 95, 0.08)', 'rgba(16, 185, 95, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ 
                borderRadius: scale(24),
                padding: scale(28),
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 95, 0.15)',
                alignItems: 'center',
              }}
            >
              {/* Glowing Icon Container */}
              <View style={{ 
                width: scale(72), 
                height: scale(72), 
                borderRadius: scale(22), 
                backgroundColor: '#10B95F',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: scale(20),
                shadowColor: '#10B95F',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 10,
              }}>
                <Ionicons name="rocket" size={scale(36)} color="#FFFFFF" />
              </View>
              
              <Text style={{ 
                fontFamily: fonts.bold, 
                fontSize: fontScale(24), 
                color: themeColors.text, 
                marginBottom: scale(10),
                textAlign: 'center',
              }}>
                Welcome to TradeX!
              </Text>
              
              <Text style={{ 
                fontFamily: fonts.regular, 
                fontSize: fontScale(15), 
                color: themeColors.textMuted, 
                lineHeight: fontScale(24), 
                textAlign: 'center',
                marginBottom: scale(28),
                paddingHorizontal: scale(10),
              }}>
                Track your trading performance with monthly summaries or individual trades.
              </Text>
              
              <View style={{ flexDirection: 'row', gap: scale(12), width: '100%' }}>
                <TouchableOpacity 
                  onPress={() => router.push('/add-month')}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={['#10B95F', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: scale(15),
                      borderRadius: scale(14),
                      alignItems: 'center',
                      shadowColor: '#10B95F',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: '#FFFFFF' }}>Add Month</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => router.push('/add-trade')}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={['#FB923C', '#F97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: scale(15),
                      borderRadius: scale(14),
                      alignItems: 'center',
                      shadowColor: '#FB923C',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: '#FFFFFF' }}>Add Trade</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Hero P&L Card */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
          <LinearGradient
            colors={stats.totalProfitLoss >= 0 ? ['#10B95F', '#059669'] : ['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ 
              borderRadius: scale(24), 
              padding: scale(24), 
              overflow: 'hidden',
              shadowColor: '#10B95F',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 25,
              elevation: 15
            }}
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
                numberOfLines={1}
                adjustsFontSizeToFit
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
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 140, 0, 0.15)', borderRadius: scale(16), padding: scale(16), gap: scale(12) }}
            >
              <View style={{ width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: '#FF8C00', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="flame" size={scale(24)} color="#FFFFFF" />
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
          <View style={{ flexDirection: 'row', gap: scale(10), flexWrap: 'wrap' }}>
            <TouchableOpacity 
              onPress={() => router.push('/add-month')}
              style={{ flex: 1, minWidth: '45%', backgroundColor: 'rgba(16, 185, 95, 0.15)', borderRadius: scale(16), padding: scale(14), alignItems: 'center', gap: scale(8) }}
            >
              <Ionicons name="calendar" size={scale(28)} color="#10B95F" style={{ opacity: 0.9 }} />
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(12), color: '#10B95F' }}>Add Month</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/add-trade')}
              style={{ flex: 1, minWidth: '45%', backgroundColor: 'rgba(251, 146, 60, 0.15)', borderRadius: scale(16), padding: scale(14), alignItems: 'center', gap: scale(8) }}
            >
              <Ionicons name="swap-horizontal" size={scale(28)} color="#FB923C" style={{ opacity: 0.9 }} />
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(12), color: '#FB923C' }}>Add Trade</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/compare')}
              style={{ flex: 1, minWidth: '45%', backgroundColor: 'rgba(99, 102, 241, 0.15)', borderRadius: scale(16), padding: scale(14), alignItems: 'center', gap: scale(8) }}
            >
              <Ionicons name="git-compare" size={scale(28)} color="#6366F1" style={{ opacity: 0.9 }} />
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(12), color: '#6366F1' }}>Compare</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowAIInsights(true)}
              style={{ flex: 1, minWidth: '45%', backgroundColor: 'rgba(225, 29, 72, 0.15)', borderRadius: scale(16), padding: scale(14), alignItems: 'center', gap: scale(8) }}
            >
              <Ionicons name="sparkles" size={scale(28)} color="#E11D48" style={{ opacity: 0.9 }} />
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(12), color: '#E11D48' }}>AI Insights</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Current Month - only show if exists */}
        {currentMonth && (
          <View style={{ paddingHorizontal: scale(20), marginBottom: scale(24) }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: scale(12) }}>
              This Month
            </Text>
            <MonthCard 
              month={currentMonth} 
              showFullDetails 
              onPress={() => router.push(`/month-details/${currentMonth.id}`)}
              tradeCount={getTradesByMonth(currentMonth.month).length}
            />
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
                  tradeCount={getTradesByMonth(month.month).length}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
