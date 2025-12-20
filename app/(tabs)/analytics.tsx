import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MilestoneCelebration } from '../../src/components/MilestoneCelebration';
import { PrivacyAwareText } from '../../src/components/PrivacyAwareText';
import { fonts } from '../../src/config/fonts';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { formatMonthDisplay } from '../../src/utils/dateUtils';
import { fontScale, scale, screenWidth } from '../../src/utils/scaling';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { months, stats, loadMonths, yearlyGoal, setYearlyGoal, trades, tradeStats } = useTrading();
  const { togglePrivacyMode, isPrivacyMode } = usePrivacy();
  const [refreshing, setRefreshing] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, value: number, index: number } | null>(null);
  
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  
  // Milestone celebration state
  const [showMilestone, setShowMilestone] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<25 | 50 | 75 | 100>(25);
  
  // Check for milestone celebrations
  useEffect(() => {
    const checkMilestone = async () => {
      if (!yearlyGoal || yearlyGoal <= 0) return;
      
      const progress = stats.totalProfitLoss / yearlyGoal;
      const milestones: (25 | 50 | 75 | 100)[] = [100, 75, 50, 25]; // Check highest first
      
      for (const milestone of milestones) {
        const threshold = milestone / 100;
        if (progress >= threshold) {
          const key = `milestone_${milestone}_${yearlyGoal}`;
          const celebrated = await AsyncStorage.getItem(key);
          if (!celebrated) {
            await AsyncStorage.setItem(key, 'true');
            setCurrentMilestone(milestone);
            setShowMilestone(true);
          }
          break; // Only show highest uncelebrated milestone
        }
      }
    };
    
    checkMilestone();
  }, [stats.totalProfitLoss, yearlyGoal]);

  const handleSaveGoal = async () => {
      const num = parseFloat(tempGoal.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) {
          await setYearlyGoal(num);
      }
      setShowGoalInput(false);
      setTempGoal('');
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMonths();
    } catch (error) {
      console.error('Refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const themeColors = {
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    card: isDark ? '#1F1F23' : '#FFFFFF',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    border: isDark ? '#27272A' : '#E4E4E7',
  };
  
  const colors = {
    primary: '#10B95F',
    profit: '#10B95F',
    loss: '#EF4444',
    purple: '#8B5CF6',
    blue: '#3B82F6',
  };
  
  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return value < 0 ? `-${formatted}` : formatted;
  };
  
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  // Calculate analytics
  const profitableMonths = months.filter(m => m.netProfitLoss > 0).length;
  const losingMonths = months.filter(m => m.netProfitLoss < 0).length;
  const winRatePercent = months.length > 0 ? (profitableMonths / months.length) * 100 : 0;
  
  const bestMonth = months.length > 0 
    ? months.reduce((best, m) => m.netProfitLoss > best.netProfitLoss ? m : best)
    : null;
    
  const worstMonth = months.length > 0
    ? months.reduce((worst, m) => m.netProfitLoss < worst.netProfitLoss ? m : worst)
    : null;
  
  // Prepare chart data - last 6 months, sorted by date
  const sortedMonths = [...months]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);
  
  const chartLabels = sortedMonths.map(m => {
    const [, month] = m.month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[parseInt(month) - 1];
  });
  
  const chartData = sortedMonths.map(m => m.netProfitLoss);
  
  // Calculate cumulative P&L for the line chart
  const cumulativeData = chartData.reduce<number[]>((acc, val) => {
    const last = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(last + val);
    return acc;
  }, []);
  
  const hasChartData = sortedMonths.length >= 2;
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: scale(140) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: scale(20), paddingTop: scale(16), paddingBottom: scale(24) }}>
          <View>
            <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(32), color: themeColors.text }}>Analytics</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(15), color: themeColors.textMuted, marginTop: scale(4) }}>Track your trading performance</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/compare')}
            style={{ 
              width: scale(44), 
              height: scale(44), 
              borderRadius: scale(12), 
              backgroundColor: themeColors.card, 
              justifyContent: 'center', 
              alignItems: 'center',
              borderWidth: 1,
              borderColor: themeColors.border
            }}
          >
            <Ionicons name="git-compare-outline" size={scale(24)} color={themeColors.text} />
          </TouchableOpacity>
        </View>
        
        
        
        {months.length === 0 && (
                // Immersive Empty State for Analytics
                <View style={{ paddingHorizontal: scale(20), paddingTop: scale(10), marginBottom: scale(20) }}>
                  <View style={{ 
                      borderRadius: scale(24), 
                      borderWidth: 1, 
                      borderColor: 'rgba(99, 102, 241, 0.3)', 
                      borderStyle: 'dashed',
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)',
                      padding: scale(32),
                      alignItems: 'center'
                  }}>
                    <View style={{ 
                      width: scale(64), height: scale(64), borderRadius: scale(32), 
                      backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                      justifyContent: 'center', alignItems: 'center',
                      marginBottom: scale(16),
                      shadowColor: '#6366F1', shadowOffset: {width: 0, height: 0}, shadowRadius: 16, shadowOpacity: 0.5, elevation: 8
                    }}>
                      <Ionicons name="analytics" size={scale(32)} color="#6366F1" />
                    </View>
                    <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: themeColors.text, marginBottom: scale(8), textAlign: 'center' }}>
                      Unlock Your Analytics
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(14), color: themeColors.textMuted, textAlign: 'center', lineHeight: fontScale(22), marginBottom: scale(24) }}>
                      Log your first month to reveal powerful insights, win rates, and performance trends.
                    </Text>
                    
                    <TouchableOpacity
                      onPress={() => router.push('/add-month')}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: '#6366F1',
                        paddingHorizontal: scale(24),
                        paddingVertical: scale(12),
                        borderRadius: scale(16),
                        shadowColor: '#6366F1',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: scale(8)
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={scale(20)} color="#FFFFFF" />
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: '#FFFFFF' }}>Log Data Now</Text>
                    </TouchableOpacity>
                  </View>
                  
                </View>
        )}

            {/* Hero Stats Card */}
            <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ 
                  borderRadius: scale(24), 
                  padding: scale(24), 
                  overflow: 'hidden',
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 30,
                  elevation: 15
                }}
              >
                {/* Decorative circles */}
                <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <View style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(20) }}>
                  <View>
                    <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: 'rgba(255,255,255,0.75)', marginBottom: scale(4) }}>Total P&L</Text>
                    <TouchableOpacity onLongPress={togglePrivacyMode} activeOpacity={0.8}>
                      <PrivacyAwareText
                        value={stats.totalProfitLoss}
                        format={formatCurrency}
                        style={{ fontFamily: fonts.extraBold, fontSize: fontScale(36), color: '#FFFFFF' }}
                        maskedValue="••••••"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{ width: scale(56), height: scale(56), borderRadius: scale(16), backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="trending-up" size={scale(28)} color="#FFFFFF" />
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', gap: scale(16) }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: scale(12), padding: scale(12), alignItems: 'center' }}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(11), color: 'rgba(255,255,255,0.7)', marginBottom: scale(4) }}>Win Rate</Text>
                    <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }}>{stats.winRate.toFixed(0)}%</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: scale(12), padding: scale(12), alignItems: 'center' }}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(11), color: 'rgba(255,255,255,0.7)', marginBottom: scale(4) }}>Avg Return</Text>
                    <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }}>{formatPercentage(stats.averageReturn)}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: scale(12), padding: scale(12), alignItems: 'center' }}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(11), color: 'rgba(255,255,255,0.7)', marginBottom: scale(4) }}>Months</Text>
                    <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }}>{months.length}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
            
            {/* Yearly Goal */}
            <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
                 <TouchableOpacity 
                    onPress={() => setShowGoalInput(true)}
                    activeOpacity={0.9}
                    style={{ 
                        borderRadius: scale(24), 
                        borderWidth: 1, 
                        borderColor: 'rgba(99, 102, 241, 0.2)', 
                        backgroundColor: themeColors.card,
                        overflow: 'hidden',
                        shadowColor: "#6366F1",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 4
                    }}
                 >
                    <LinearGradient
                        colors={isDark ? ['rgba(99, 102, 241, 0.15)', 'rgba(139, 92, 246, 0.05)'] : ['rgba(99, 102, 241, 0.08)', 'rgba(139, 92, 246, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: scale(24) }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: scale(20) }}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: scale(4) }}>
                                    <Ionicons name="flag" size={scale(16)} color="#6366F1" />
                                    <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(14), color: '#6366F1', textTransform: 'uppercase', letterSpacing: 0.5 }}>Yearly Target</Text>
                                </View>
                                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>
                                    {stats.totalProfitLoss >= (yearlyGoal || 0) && (yearlyGoal || 0) > 0 ? "Goal Achieved!" : "Keep pushing!"}
                                </Text>
                            </View>
                            {(yearlyGoal || 0) > 0 && (
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(16), color: themeColors.text }}>{Math.round((stats.totalProfitLoss / (yearlyGoal || 1)) * 100)}%</Text>
                                    <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(11), color: themeColors.textMuted }}>Complete</Text>
                                </View>
                            )}
                        </View>

                        {(yearlyGoal || 0) > 0 ? (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: scale(4), marginBottom: scale(12) }}>
                                    <PrivacyAwareText 
                                        value={stats.totalProfitLoss} 
                                        format={formatCurrency} 
                                        style={{ fontFamily: fonts.bold, fontSize: fontScale(32), color: themeColors.text }} 
                                        maskedValue="••••••"
                                    />
                                    <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: themeColors.textMuted, marginBottom: scale(4) }}>
                                        / {formatCurrency(yearlyGoal || 0)}
                                    </Text>
                                </View>
                                
                                <View style={{ height: scale(12), backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: scale(6), overflow: 'hidden', marginBottom: scale(12) }}>
                                    <LinearGradient
                                        colors={['#6366F1', '#8B5CF6']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ 
                                            height: '100%', 
                                            width: `${Math.min(Math.max((stats.totalProfitLoss / (yearlyGoal || 1)) * 100, 0), 100)}%`, 
                                            borderRadius: scale(6)
                                        }} 
                                    />
                                </View>
                                
                                {stats.totalProfitLoss < (yearlyGoal || 0) && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: scale(4) }}>
                                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>To go:</Text>
                                        <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(13), color: themeColors.text }}>
                                            {formatCurrency((yearlyGoal || 0) - stats.totalProfitLoss)}
                                        </Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: scale(10) }}>
                                <View style={{ width: scale(48), height: scale(48), borderRadius: scale(24), backgroundColor: 'rgba(99, 102, 241, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: scale(12) }}>
                                    <Ionicons name="add" size={scale(24)} color="#6366F1" />
                                </View>
                                <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text, marginBottom: scale(4) }}>Set a 2025 Goal</Text>
                                <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(13), color: themeColors.textMuted }}>Tap to track your yearly progress</Text>
                            </View>
                        )}
                    </LinearGradient>
                 </TouchableOpacity>
            </View>

            {months.length > 0 && (
              <>
                {/* P&L Chart */}
                {hasChartData && (
                  <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
                    <View style={{ backgroundColor: themeColors.card, borderRadius: scale(20), padding: scale(20), borderWidth: 1, borderColor: themeColors.border }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(16) }}>
                        <View>
                          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(17), color: themeColors.text }}>Cumulative P&L</Text>
                          <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(13), color: themeColors.textMuted, marginTop: scale(2) }}>Last {sortedMonths.length} months</Text>
                        </View>
                        <View style={{ backgroundColor: cumulativeData[cumulativeData.length - 1] >= 0 ? 'rgba(16, 185, 95, 0.1)' : 'rgba(239, 68, 68, 0.1)', paddingHorizontal: scale(10), paddingVertical: scale(6), borderRadius: scale(8) }}>
                          <PrivacyAwareText 
                            value={cumulativeData[cumulativeData.length - 1] || 0} 
                            format={formatCurrency} 
                            style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: cumulativeData[cumulativeData.length - 1] >= 0 ? colors.profit : colors.loss }} 
                            maskedValue="••••"
                          />
                        </View>
                      </View>
                      <LineChart
                        data={{
                          labels: chartLabels,
                          datasets: [{ 
                            data: cumulativeData.length > 0 ? cumulativeData : [0],
                            color: () => colors.primary,
                            strokeWidth: 3,
                          }],
                        }}
                        width={screenWidth - scale(80)}
                        height={scale(180)}
                        yAxisLabel={isPrivacyMode ? "" : "$"}
                        yAxisSuffix={isPrivacyMode ? "" : ""}
                        formatYLabel={(val) => isPrivacyMode ? "•••" : parseInt(val).toLocaleString()}
                        chartConfig={{
                          backgroundColor: 'transparent',
                          backgroundGradientFrom: themeColors.card,
                          backgroundGradientTo: themeColors.card,
                          decimalPlaces: 0,
                          color: () => colors.primary,
                          labelColor: () => themeColors.textMuted,
                          propsForDots: {
                            r: '6',
                            strokeWidth: '2',
                            stroke: colors.primary,
                            fill: themeColors.card,
                          },
                          propsForBackgroundLines: {
                            strokeDasharray: '',
                            stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          },
                        }}
                        bezier
                        style={{ borderRadius: scale(12), marginLeft: -scale(16) }}
                        withInnerLines={true}
                        withOuterLines={false}
                        onDataPointClick={({ value, x, y, index }) => {
                          if (isPrivacyMode) return;
                          setTooltip({
                            x, y, value, index
                          });
                          setTimeout(() => setTooltip(null), 3000);
                        }}
                        decorator={() => {
                          return tooltip ? (
                            <View style={{
                              position: 'absolute',
                              left: tooltip.x - 40,
                              top: tooltip.y - 40,
                              backgroundColor: themeColors.text,
                              padding: 8,
                              borderRadius: 8,
                              zIndex: 100
                            }}>
                              <Text style={{ color: themeColors.bg, fontSize: 12, fontWeight: 'bold' }}>
                                {formatCurrency(tooltip.value)}
                              </Text>
                            </View>
                          ) : null;
                        }}
                      />
                    </View>
                  </View>
                )}
                
                {/* Win/Loss Breakdown */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
                  <View style={{ backgroundColor: themeColors.card, borderRadius: scale(20), padding: scale(20), borderWidth: 1, borderColor: themeColors.border }}>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(17), color: themeColors.text, marginBottom: scale(20) }}>Win/Loss Breakdown</Text>
                    
                    <View style={{ flexDirection: 'row', marginBottom: scale(20) }}>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <View style={{ width: scale(64), height: scale(64), borderRadius: scale(32), backgroundColor: 'rgba(16, 185, 95, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: scale(12) }}>
                          <Text style={{ fontFamily: fonts.extraBold, fontSize: fontScale(24), color: colors.profit }}>{profitableMonths}</Text>
                        </View>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: colors.profit }}>Winning</Text>
                      </View>
                      
                      <View style={{ width: 1, backgroundColor: themeColors.border }} />
                      
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <View style={{ width: scale(64), height: scale(64), borderRadius: scale(32), backgroundColor: 'rgba(239, 68, 68, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: scale(12) }}>
                          <Text style={{ fontFamily: fonts.extraBold, fontSize: fontScale(24), color: colors.loss }}>{losingMonths}</Text>
                        </View>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: colors.loss }}>Losing</Text>
                      </View>
                    </View>
                    
                    {/* Progress Bar with Labels */}
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(8) }}>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>{winRatePercent.toFixed(0)}% Win Rate</Text>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>{(100 - winRatePercent).toFixed(0)}% Loss Rate</Text>
                      </View>
                      <View style={{ flexDirection: 'row', height: scale(12), borderRadius: scale(6), overflow: 'hidden', gap: 3 }}>
                        <View style={{ height: '100%', borderRadius: scale(6), backgroundColor: colors.profit, flex: profitableMonths || 0.5 }} />
                        <View style={{ height: '100%', borderRadius: scale(6), backgroundColor: colors.loss, flex: losingMonths || 0.5 }} />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Risk Analysis */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
                  <View style={{ backgroundColor: themeColors.card, borderRadius: scale(20), padding: scale(20), borderWidth: 1, borderColor: themeColors.border }}>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(17), color: themeColors.text, marginBottom: scale(20) }}>Risk Analysis</Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(16) }}>
                       <View style={{ flex: 1 }}>
                         <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>Avg Win</Text>
                         <PrivacyAwareText value={stats.averageWin || 0} format={formatCurrency} style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: colors.profit, marginTop: scale(4) }} maskedValue="••••" />
                       </View>
                       <View style={{ flex: 1 }}>
                         <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>Avg Loss</Text>
                         <PrivacyAwareText value={stats.averageLoss || 0} format={formatCurrency} style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: colors.loss, marginTop: scale(4) }} maskedValue="••••" />
                       </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: themeColors.border, marginVertical: scale(8) }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: scale(8) }}>
                       <View style={{ flex: 1 }}>
                         <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>Profit Factor</Text>
                         <Text style={{ fontFamily: fonts.extraBold, fontSize: fontScale(24), color: themeColors.text, marginTop: scale(4) }}>
                            {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                         </Text>
                       </View>
                       
                       <View style={{ flex: 1, justifyContent: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stats.profitFactor > 1.5 ? colors.profit : stats.profitFactor > 1 ? '#FBBF24' : colors.loss }} />
                              <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>
                                 {stats.profitFactor > 1.5 ? 'Excellent' : stats.profitFactor > 1 ? 'Good' : 'Needs Work'}
                              </Text>
                          </View>
                       </View>
                    </View>
                  </View>
                </View>
            </>
            )}

            {/* Performance Extremes */}
            {months.length > 0 && (
            <View style={{ paddingHorizontal: scale(20) }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(17), color: themeColors.text, marginBottom: scale(12) }}>Performance Extremes</Text>
              
              {bestMonth && (
                <View style={{ backgroundColor: themeColors.card, borderRadius: scale(16), padding: scale(16), marginBottom: scale(12), borderWidth: 1, borderColor: themeColors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <LinearGradient
                      colors={['#10B95F', '#059669']}
                      style={{ width: scale(48), height: scale(48), borderRadius: scale(14), justifyContent: 'center', alignItems: 'center', marginRight: scale(14) }}
                    >
                      <Ionicons name="trophy" size={scale(24)} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>Best Month</Text>
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text }}>{formatMonthDisplay(bestMonth.month)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <PrivacyAwareText value={bestMonth.netProfitLoss} format={formatCurrency} style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: colors.profit }} maskedValue="••••" />
                      <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>+{bestMonth.returnPercentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                </View>
              )}
              
              {worstMonth && (
                <View style={{ backgroundColor: themeColors.card, borderRadius: scale(16), padding: scale(16), borderWidth: 1, borderColor: themeColors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      style={{ width: scale(48), height: scale(48), borderRadius: scale(14), justifyContent: 'center', alignItems: 'center', marginRight: scale(14) }}
                    >
                      <Ionicons name="trending-down" size={scale(24)} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>Worst Month</Text>
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text }}>{formatMonthDisplay(worstMonth.month)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <PrivacyAwareText value={worstMonth.netProfitLoss} format={formatCurrency} style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: colors.loss }} maskedValue="••••" />
                      <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>{worstMonth.returnPercentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
            )}

            {/* Trade Performance Section */}
            {trades.length > 0 && (
              <View style={{ paddingHorizontal: scale(20), marginTop: scale(20) }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(17), color: themeColors.text, marginBottom: scale(12) }}>Individual Trades</Text>
                
                {/* Trade Stats Summary */}
                <View style={{ backgroundColor: themeColors.card, borderRadius: scale(20), padding: scale(20), marginBottom: scale(12), borderWidth: 1, borderColor: themeColors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(16) }}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(24), color: tradeStats.totalPnL >= 0 ? colors.profit : colors.loss }}>
                        {tradeStats.totalPnL >= 0 ? '+' : ''}{formatCurrency(tradeStats.totalPnL)}
                      </Text>
                      <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>Total Trade P&L</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(24), color: themeColors.text }}>{tradeStats.totalTrades}</Text>
                      <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>Trades</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(24), color: themeColors.text }}>{tradeStats.winRate.toFixed(0)}%</Text>
                      <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>Win Rate</Text>
                    </View>
                  </View>
                  
                  {/* Win/Loss Progress Bar */}
                  <View style={{ flexDirection: 'row', height: scale(8), borderRadius: scale(4), overflow: 'hidden', gap: 2 }}>
                    <View style={{ flex: tradeStats.winningTrades || 0.5, backgroundColor: colors.profit, borderRadius: scale(4) }} />
                    <View style={{ flex: tradeStats.losingTrades || 0.5, backgroundColor: colors.loss, borderRadius: scale(4) }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: scale(6) }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(11), color: themeColors.textMuted }}>{tradeStats.winningTrades} Wins</Text>
                    <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(11), color: themeColors.textMuted }}>{tradeStats.losingTrades} Losses</Text>
                  </View>
                </View>
                
                {/* Streaks */}
                {(tradeStats.longestWinStreak >= 3 || tradeStats.longestLoseStreak >= 3) && (
                  <View style={{ backgroundColor: themeColors.card, borderRadius: scale(16), padding: scale(16), marginBottom: scale(12), borderWidth: 1, borderColor: themeColors.border }}>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: themeColors.text, marginBottom: scale(12) }}>Streaks</Text>
                    <View style={{ flexDirection: 'row', gap: scale(12) }}>
                      <View style={{ flex: 1, backgroundColor: 'rgba(16, 185, 95, 0.1)', borderRadius: scale(12), padding: scale(12), alignItems: 'center' }}>
                        <Ionicons name="flame" size={scale(20)} color={colors.profit} />
                        <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: colors.profit, marginTop: scale(4) }}>{tradeStats.longestWinStreak}</Text>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(11), color: themeColors.textMuted }}>Best Win Streak</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: scale(12), padding: scale(12), alignItems: 'center' }}>
                        <Ionicons name="snow" size={scale(20)} color={colors.loss} />
                        <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: colors.loss, marginTop: scale(4) }}>{tradeStats.longestLoseStreak}</Text>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(11), color: themeColors.textMuted }}>Worst Lose Streak</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Best & Worst Trades */}
                {tradeStats.bestTrade && (
                  <View style={{ backgroundColor: themeColors.card, borderRadius: scale(16), padding: scale(16), marginBottom: scale(12), borderWidth: 1, borderColor: themeColors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <LinearGradient
                        colors={['#10B95F', '#059669']}
                        style={{ width: scale(48), height: scale(48), borderRadius: scale(14), justifyContent: 'center', alignItems: 'center', marginRight: scale(14) }}
                      >
                        <Ionicons name="trending-up" size={scale(24)} color="#FFFFFF" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>Best Trade</Text>
                        <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text }}>{tradeStats.bestTrade.symbol}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: colors.profit }}>+{formatCurrency(tradeStats.bestTrade.pnl)}</Text>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>+{tradeStats.bestTrade.returnPercentage.toFixed(1)}%</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {tradeStats.worstTrade && (
                  <View style={{ backgroundColor: themeColors.card, borderRadius: scale(16), padding: scale(16), borderWidth: 1, borderColor: themeColors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={{ width: scale(48), height: scale(48), borderRadius: scale(14), justifyContent: 'center', alignItems: 'center', marginRight: scale(14) }}
                      >
                        <Ionicons name="trending-down" size={scale(24)} color="#FFFFFF" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>Worst Trade</Text>
                        <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text }}>{tradeStats.worstTrade.symbol}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: colors.loss }}>{formatCurrency(tradeStats.worstTrade.pnl)}</Text>
                        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>{tradeStats.worstTrade.returnPercentage.toFixed(1)}%</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
      </ScrollView>

      {/* Goal Input Modal */}
      <Modal
        visible={showGoalInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalInput(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowGoalInput(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={{ backgroundColor: themeColors.card, borderRadius: 24, padding: 24 }}>
                            <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: themeColors.text, marginBottom: 8, textAlign: 'center' }}>Set Yearly Goal</Text>
                            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: themeColors.textMuted, marginBottom: 20, textAlign: 'center' }}>
                                What is your profit target for this year?
                            </Text>
                            
                            <View style={{ backgroundColor: themeColors.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, borderWidth: 1, borderColor: themeColors.border }}>
                                <TextInput
                                    placeholder="e.g. 50,000"
                                    placeholderTextColor={themeColors.textMuted}
                                    style={{ fontFamily: fonts.bold, fontSize: 24, color: themeColors.text, textAlign: 'center' }}
                                    keyboardType="numeric"
                                    value={tempGoal}
                                    onChangeText={setTempGoal}
                                    autoFocus
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity 
                                    onPress={() => setShowGoalInput(false)}
                                    style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: themeColors.bg, alignItems: 'center' }}
                                >
                                    <Text style={{ fontFamily: fonts.semiBold, color: themeColors.text }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={handleSaveGoal}
                                    style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#6366F1', alignItems: 'center' }}
                                >
                                    <Text style={{ fontFamily: fonts.semiBold, color: '#FFFFFF' }}>Save Goal</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* Milestone Celebration Modal */}
      <MilestoneCelebration
        visible={showMilestone}
        milestone={currentMilestone}
        onClose={() => setShowMilestone(false)}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}
