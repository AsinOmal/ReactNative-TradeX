import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../src/config/fonts';
import { colors } from '../../src/config/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CalendarScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { months: monthRecords } = useTrading();
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const themeColors = {
    bg: isDark ? colors.darkBg : colors.lightBg,
    card: isDark ? colors.darkCard : colors.lightCard,
    border: isDark ? colors.darkBorder : colors.lightBorder,
    text: isDark ? colors.textLight : colors.textDark,
    textMuted: isDark ? colors.textMuted : colors.textMutedLight,
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>Calendar</Text>
        </View>
        
        {/* Streak Card */}
        {streak > 0 && (
          <View style={[styles.streakCard, { backgroundColor: colors.primary }]}>
            <View style={styles.streakIcon}>
              <Text style={styles.streakEmoji}>🔥</Text>
            </View>
            <View style={styles.streakContent}>
              <Text style={styles.streakLabel}>Profit Streak</Text>
              <Text style={styles.streakValue}>{streak} months</Text>
            </View>
          </View>
        )}
        
        {/* Year Selector */}
        <View style={styles.yearSelector}>
          <TouchableOpacity 
            style={[styles.yearButton, { backgroundColor: themeColors.card }]}
            onPress={() => setSelectedYear(y => y - 1)}
          >
            <Ionicons name="chevron-back" size={20} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.yearText, { color: themeColors.text }]}>{selectedYear}</Text>
          <TouchableOpacity 
            style={[styles.yearButton, { backgroundColor: themeColors.card }]}
            onPress={() => setSelectedYear(y => y + 1)}
            disabled={selectedYear >= currentYear}
          >
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={selectedYear >= currentYear ? themeColors.textMuted : themeColors.text} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {MONTHS.map((month, index) => {
            const data = getMonthData(index);
            const isFuture = isFutureMonth(index);
            
            let bgColor = themeColors.card;
            let statusColor = themeColors.textMuted;
            
            if (data) {
              bgColor = data.netProfitLoss >= 0 ? colors.profitAlpha : colors.lossAlpha;
              statusColor = data.netProfitLoss >= 0 ? colors.profit : colors.loss;
            }
            
            return (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthCell,
                  { backgroundColor: bgColor, borderColor: themeColors.border },
                  isFuture && styles.futureMonth,
                ]}
                onPress={() => data && router.push(`/month-details/${data.id}`)}
                disabled={!data || isFuture}
              >
                <Text style={[
                  styles.monthName,
                  { color: isFuture ? themeColors.textMuted : themeColors.text }
                ]}>
                  {month}
                </Text>
                {data && (
                  <>
                    <Text style={[styles.monthPnL, { color: statusColor }]}>
                      {data.netProfitLoss >= 0 ? '+' : ''}
                      ${Math.abs(data.netProfitLoss).toLocaleString()}
                    </Text>
                    <View style={[styles.monthIndicator, { backgroundColor: statusColor }]} />
                  </>
                )}
                {!data && !isFuture && (
                  <Text style={[styles.noData, { color: themeColors.textMuted }]}>-</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.profit }]} />
            <Text style={[styles.legendText, { color: themeColors.textMuted }]}>Profit</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.loss }]} />
            <Text style={[styles.legendText, { color: themeColors.textMuted }]}>Loss</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: themeColors.border }]} />
            <Text style={[styles.legendText, { color: themeColors.textMuted }]}>No Data</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakContent: {
    flex: 1,
  },
  streakLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  streakValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.white,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 20,
  },
  yearButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearText: {
    fontFamily: fonts.bold,
    fontSize: 24,
    minWidth: 80,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 10,
  },
  monthCell: {
    width: 100,
    height: 100,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  futureMonth: {
    opacity: 0.4,
  },
  monthName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  monthPnL: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  monthIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  noData: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
