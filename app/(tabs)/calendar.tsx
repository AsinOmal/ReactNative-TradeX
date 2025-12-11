import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
  const { months: monthRecords } = useTrading();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
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
  
  // Calculate tile width (3 columns with gaps)
  const tileWidth = (screenWidth - scale(40) - scale(20)) / 3; // 40 = horizontal padding, 20 = 2 gaps
  
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: themeColors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(140) }}>
        {/* Header */}
        <View style={{ paddingHorizontal: scale(20), paddingTop: scale(16), paddingBottom: scale(20) }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(32), color: themeColors.text }}>Calendar</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(15), color: themeColors.textMuted, marginTop: scale(4) }}>View your monthly performance</Text>
        </View>
        
        {/* Year Selector with Integrated Streak */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: scale(24) }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            backgroundColor: streak > 0 ? '#FFB800' : themeColors.card, 
            borderRadius: scale(16), 
            padding: scale(6), 
            borderWidth: 1, 
            borderColor: streak > 0 ? '#FFB800' : themeColors.border,
            shadowColor: streak > 0 ? '#FFB800' : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: streak > 0 ? 0.3 : 0,
            shadowRadius: 10,
            elevation: streak > 0 ? 8 : 0,
          }}>
            <TouchableOpacity 
              style={{ width: scale(44), height: scale(44), borderRadius: scale(12), backgroundColor: streak > 0 ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setSelectedYear(y => y - 1)}
            >
              <Ionicons name="chevron-back" size={scale(22)} color={streak > 0 ? '#FFFFFF' : themeColors.text} />
            </TouchableOpacity>
            
            <View style={{ flex: 1, alignItems: 'center' }}>
              {/* Main Row: Streak Number - Year - Fire Icon */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {streak > 0 && (
                  <View style={{ width: scale(40), alignItems: 'flex-end', marginRight: scale(16) }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF', opacity: 0.9 }}>{streak}</Text>
                  </View>
                )}
                
                <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(26), color: streak > 0 ? '#FFFFFF' : themeColors.text }}>{selectedYear}</Text>
                
                {streak > 0 && (
                  <View style={{ width: scale(40), alignItems: 'flex-start', marginLeft: scale(16) }}>
                    <Ionicons name="flame" size={scale(22)} color="#FFFFFF" style={{ opacity: 0.9 }} />
                  </View>
                )}
              </View>
              
              {stats.total > 0 && (
                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: streak > 0 ? 'rgba(255,255,255,0.9)' : (stats.totalPnL >= 0 ? colors.profit : colors.loss), marginTop: -scale(2) }}>
                  {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={{ width: scale(44), height: scale(44), borderRadius: scale(12), backgroundColor: streak > 0 ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), justifyContent: 'center', alignItems: 'center', opacity: selectedYear >= currentYear ? 0.4 : 1 }}
              onPress={() => setSelectedYear(y => y + 1)}
              disabled={selectedYear >= currentYear}
            >
              <Ionicons name="chevron-forward" size={scale(22)} color={streak > 0 ? '#FFFFFF' : themeColors.text} />
            </TouchableOpacity>
          </View>
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
              bgColor = data.netProfitLoss >= 0 ? colors.profitLight : colors.lossLight;
              borderColor = data.netProfitLoss >= 0 ? 'rgba(16, 185, 95, 0.3)' : 'rgba(239, 68, 68, 0.3)';
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
      </ScrollView>
    </SafeAreaView>
  );
}
