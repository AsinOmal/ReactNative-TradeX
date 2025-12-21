import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../src/config/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { fontScale, scale, screenWidth } from '../../src/utils/scaling';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { months: monthRecords, loadMonths } = useTrading();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [refreshing, setRefreshing] = useState(false);

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
    border: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
  };
  
  const colors = {
    primary: '#10B95F',
    profit: '#10B95F',
    loss: '#EF4444',
    profitLight: 'rgba(16, 185, 95, 0.15)',
    lossLight: 'rgba(239, 68, 68, 0.15)',
    white: '#FFFFFF',
  };
  
  // Get month data for the selected year
  const getMonthData = (monthIndex: number) => {
    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    return monthRecords.find(m => m.month === monthKey);
  };
  
  // Check if month is in the future
  const isFutureMonth = (monthIndex: number) => {
    const now = new Date();
    return selectedYear > now.getFullYear() || 
      (selectedYear === now.getFullYear() && monthIndex > now.getMonth());
  };
  
  // Check if it's the current month
  const isCurrentMonth = (monthIndex: number) => {
    return selectedYear === currentYear && monthIndex === currentMonth;
  };
  
  // Calculate stats for the year
  const yearStats = () => {
    const yearMonths = monthRecords.filter(m => m.month.startsWith(`${selectedYear}-`));
    const totalPnL = yearMonths.reduce((sum, m) => sum + m.netProfitLoss, 0);
    const profitMonths = yearMonths.filter(m => m.netProfitLoss > 0).length;
    const lossMonths = yearMonths.filter(m => m.netProfitLoss < 0).length;
    return { totalPnL, profitMonths, lossMonths, total: yearMonths.length };
  };
  
  // Calculate profit streak
  const calculateStreak = () => {
    const sortedMonths = [...monthRecords]
      .filter(m => m.status === 'closed')
      .sort((a, b) => b.month.localeCompare(a.month));
    
    let streak = 0;
    for (const month of sortedMonths) {
      if (month.netProfitLoss > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };
  
  const streak = calculateStreak();
  const stats = yearStats();
  
  // Calculate max absolute P&L for the year (for intensity scaling)
  const yearMonths = monthRecords.filter(m => m.month.startsWith(`${selectedYear}-`));
  const maxAbsPnL = Math.max(
    ...yearMonths.map(m => Math.abs(m.netProfitLoss)),
    1 // prevent division by zero
  );
  
  // Get intensity-based color (stronger color for bigger gains/losses)
  const getHeatMapColor = (pnl: number, isBackground: boolean) => {
    const intensity = Math.min(Math.abs(pnl) / maxAbsPnL, 1); // 0 to 1
    const minOpacity = isBackground ? 0.08 : 0.3;
    const maxOpacity = isBackground ? 0.25 : 0.5;
    const opacity = minOpacity + (intensity * (maxOpacity - minOpacity));
    
    if (pnl >= 0) {
      return `rgba(16, 185, 95, ${opacity})`;
    } else {
      return `rgba(239, 68, 68, ${opacity})`;
    }
  };
  
  // Calculate tile width (3 columns with gaps)
  const tileWidth = (screenWidth - scale(40) - scale(20)) / 3; // 40 = horizontal padding, 20 = 2 gaps
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: scale(140) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: scale(20), paddingTop: scale(16), paddingBottom: scale(20) }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(32), color: themeColors.text }}>Calendar</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(15), color: themeColors.textMuted, marginTop: scale(4) }}>View your monthly performance</Text>
        </View>
        
        {monthRecords.length === 0 ? (
          <View style={{ paddingHorizontal: scale(20), paddingTop: scale(40) }}>
            <LinearGradient
              colors={isDark ? ['rgba(245, 158, 11, 0.15)', 'rgba(217, 119, 6, 0.05)'] : ['rgba(245, 158, 11, 0.08)', 'rgba(217, 119, 6, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ 
                  borderRadius: scale(24), 
                  padding: scale(32),
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
              }}
            >
                {/* Decorative Background Elements */}
                <View style={{ position: 'absolute', top: -30, right: -30, width: scale(120), height: scale(120), borderRadius: scale(60), backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)' }} />
                <View style={{ position: 'absolute', bottom: -40, left: -20, width: scale(100), height: scale(100), borderRadius: scale(50), backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.03)' }} />

                {/* Main Content */}
                <View style={{ 
                  width: scale(72), height: scale(72), borderRadius: scale(36), 
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)', 
                  justifyContent: 'center', alignItems: 'center',
                  marginBottom: scale(20),
                  borderWidth: 1, borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.15)',
                }}>
                  <Ionicons name="calendar" size={scale(36)} color="#F59E0B" />
                </View>
                
                <Text style={{ fontFamily: fonts.extraBold, fontSize: fontScale(22), color: themeColors.text, marginBottom: scale(10), textAlign: 'center' }}>
                  Unlock Your Calendar
                </Text>
                
                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(15), color: themeColors.textMuted, textAlign: 'center', lineHeight: fontScale(24), marginBottom: scale(28) }}>
                  Visualize your consistency. Log your first trading month to populate your calendar and track streaks.
                </Text>
                
                <TouchableOpacity
                  onPress={() => router.push('/add-month')}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#F59E0B',
                    paddingHorizontal: scale(28),
                    paddingVertical: scale(14),
                    borderRadius: scale(18),
                    shadowColor: '#F59E0B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: scale(10)
                  }}
                >
                  <Ionicons name="add-circle" size={scale(22)} color="#FFFFFF" />
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(15), color: '#FFFFFF' }}>Start Journaling</Text>
                </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <>
        {/* Year Selector with Integrated Streak */}
       <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
        {streak > 0 && selectedYear === currentYear ? (
          /* Streak Mode - Premium Gradient Design */
          <LinearGradient
            colors={['#FBBF24', '#D97706', '#92400E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: scale(24),
              padding: scale(4),
              shadowColor: '#F59E0B',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 20,
              elevation: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.4)',
              overflow: 'hidden', // Ensure decorations don't bleed out
            }}
          >
            {/* Decorative Background Rays/Glows */}
            <View style={{ position: 'absolute', top: -50, left: -50, width: scale(150), height: scale(150), borderRadius: scale(75), backgroundColor: 'rgba(255, 255, 255, 0.1)', opacity: 0.6 }} />
            <View style={{ position: 'absolute', bottom: -30, right: -20, width: scale(100), height: scale(100), borderRadius: scale(50), backgroundColor: 'rgba(255, 220, 0, 0.15)', opacity: 0.5 }} />
            <View style={{ position: 'absolute', top: '50%', left: '50%', width: scale(200), height: scale(40), backgroundColor: 'rgba(255, 255, 255, 0.05)', transform: [{ translateX: -100 }, { rotate: '45deg' }] }} />

            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingVertical: scale(12),
              paddingHorizontal: scale(8),
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(12) }}>
                <TouchableOpacity 
                  onPress={() => setSelectedYear(y => y - 1)}
                  style={{
                    width: scale(40),
                    height: scale(40),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="chevron-back" size={scale(28)} color="#FFFFFF" />
                </TouchableOpacity>
                
                <LinearGradient
                  colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                  style={{
                    paddingHorizontal: scale(16),
                    paddingVertical: scale(8),
                    borderRadius: scale(14),
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 4 }}>{streak}</Text>
                </LinearGradient>
              </View>
              
              {/* Center - Year + P&L */}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(28), color: '#FFFFFF', letterSpacing: 1 }}>{selectedYear}</Text>
                {stats.total > 0 && (
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: 'rgba(255,255,255,0.9)', marginTop: scale(2) }}>
                    {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </Text>
                )}
              </View>
              
              {/* Right - Fire Icon + Forward Arrow */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(12) }}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                  style={{
                    width: scale(48),
                    height: scale(48),
                    borderRadius: scale(16),
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Ionicons name="flame" size={scale(24)} color="#FFFFFF" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4 }} />
                </LinearGradient>
                
                <TouchableOpacity 
                  onPress={() => setSelectedYear(y => y + 1)}
                  disabled={selectedYear >= currentYear}
                  style={{
                    width: scale(40),
                    height: scale(40),
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: selectedYear >= currentYear ? 0.4 : 1,
                  }}
                >
                  <Ionicons name="chevron-forward" size={scale(28)} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        ) : (
          /* Normal Mode - Clean Card Design */
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: themeColors.card,
            borderRadius: scale(20),
            paddingVertical: scale(16),
            paddingHorizontal: scale(12),
            borderWidth: 1,
            borderColor: themeColors.border,
          }}>
            {/* Left - Back Arrow */}
            <TouchableOpacity 
              onPress={() => setSelectedYear(y => y - 1)}
              style={{
                width: scale(40),
                height: scale(40),
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={scale(28)} color={themeColors.text} />
            </TouchableOpacity>
            
            {/* Center - Year + P&L */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(28), color: themeColors.text, letterSpacing: 1 }}>{selectedYear}</Text>
              {stats.total > 0 && (
                <Text style={{ 
                  fontFamily: fonts.semiBold, 
                  fontSize: fontScale(14), 
                  color: stats.totalPnL >= 0 ? colors.profit : colors.loss,
                  marginTop: scale(2),
                }}>
                  {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                </Text>
              )}
            </View>
            
            {/* Right - Forward Arrow */}
            <TouchableOpacity 
              onPress={() => setSelectedYear(y => y + 1)}
              disabled={selectedYear >= currentYear}
              style={{
                width: scale(40),
                height: scale(40),
                justifyContent: 'center',
                alignItems: 'center',
                opacity: selectedYear >= currentYear ? 0.4 : 1,
              }}
            >
              <Ionicons name="chevron-forward" size={scale(28)} color={themeColors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>
        
        {/* Calendar Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: scale(20), gap: scale(10) }}>
          {MONTHS.map((month, index) => {
            const data = getMonthData(index);
            const isFuture = isFutureMonth(index);
            const isCurrent = isCurrentMonth(index);
            
            let bgColor = themeColors.card;
            let borderColor = themeColors.border;
            let statusColor = themeColors.textMuted;
            
            if (data) {
              // Use intensity-based heat map colors
              bgColor = getHeatMapColor(data.netProfitLoss, true);
              borderColor = getHeatMapColor(data.netProfitLoss, false);
              statusColor = data.netProfitLoss >= 0 ? colors.profit : colors.loss;
            }
            
            if (isCurrent && !data) {
              borderColor = colors.primary;
            }
            
            return (
              <TouchableOpacity
                key={month}
                style={{
                  width: tileWidth,
                  aspectRatio: 1,
                  borderRadius: scale(16),
                  padding: scale(12),
                  borderWidth: isCurrent ? 2 : 1,
                  borderColor: borderColor,
                  backgroundColor: bgColor,
                  justifyContent: 'space-between',
                  opacity: isFuture ? 0.35 : 1,
                }}
                onPress={() => data && router.push(`/month-details/${data.id}`)}
                disabled={!data || isFuture}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: isFuture ? themeColors.textMuted : themeColors.text }}>
                    {month}
                  </Text>
                  {isCurrent && !isFuture && (
                    <View style={{ width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: colors.primary }} />
                  )}
                </View>
                
                {data ? (
                  <View>
                    <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(15), color: statusColor }} numberOfLines={1}>
                      {data.netProfitLoss >= 0 ? '+' : ''}${Math.abs(data.netProfitLoss).toLocaleString()}
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(11), color: themeColors.textMuted, marginTop: scale(2) }}>
                      {data.returnPercentage >= 0 ? '+' : ''}{data.returnPercentage.toFixed(1)}%
                    </Text>
                  </View>
                ) : !isFuture ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(4) }}>
                    <Ionicons name="remove" size={scale(14)} color={themeColors.textMuted} />
                    <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: themeColors.textMuted }}>No data</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Year Summary */}
        {stats.total > 0 && (
          <View style={{ paddingHorizontal: scale(20), marginTop: scale(24) }}>
            <View style={{ backgroundColor: themeColors.card, borderRadius: scale(16), padding: scale(20), borderWidth: 1, borderColor: themeColors.border }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text, marginBottom: scale(16) }}>{selectedYear} Summary</Text>
              
              <View style={{ flexDirection: 'row', gap: scale(12) }}>
                <View style={{ flex: 1, backgroundColor: colors.profitLight, borderRadius: scale(12), padding: scale(14), alignItems: 'center' }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(24), color: colors.profit }}>{stats.profitMonths}</Text>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: colors.profit }}>Winning</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.lossLight, borderRadius: scale(12), padding: scale(14), alignItems: 'center' }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(24), color: colors.loss }}>{stats.lossMonths}</Text>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: colors.loss }}>Losing</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: scale(12), padding: scale(14), alignItems: 'center' }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(24), color: themeColors.text }}>{stats.total}</Text>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted }}>Total</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: scale(24), gap: scale(20), paddingHorizontal: scale(20) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
            <View style={{ width: scale(12), height: scale(12), borderRadius: scale(6), backgroundColor: colors.profit }} />
            <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>Profit</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
            <View style={{ width: scale(12), height: scale(12), borderRadius: scale(6), backgroundColor: colors.loss }} />
            <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>Loss</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
            <View style={{ width: scale(12), height: scale(12), borderRadius: scale(6), borderWidth: 1, borderColor: themeColors.border }} />
            <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>No Data</Text>
          </View>
        </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
