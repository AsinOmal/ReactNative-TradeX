import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../src/config/fonts';
import { colors } from '../../src/config/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { isDark } = useTheme();
  const { months, stats } = useTrading();
  
  const themeColors = {
    bg: isDark ? colors.darkBg : colors.lightBg,
    card: isDark ? colors.darkCard : colors.lightCard,
    text: isDark ? colors.textLight : colors.textDark,
    textMuted: isDark ? colors.textMuted : colors.textMutedLight,
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
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  // Calculate analytics
  const profitableMonths = months.filter(m => {
    const pnl = m.endingCapital - m.startingCapital;
    return pnl > 0;
  }).length;
  
  const losingMonths = months.filter(m => {
    const pnl = m.endingCapital - m.startingCapital;
    return pnl < 0;
  }).length;
  
  const bestMonth = months.length > 0 
    ? months.reduce((best, m) => {
        const pnl = m.endingCapital - m.startingCapital;
        const bestPnl = best.endingCapital - best.startingCapital;
        return pnl > bestPnl ? m : best;
      })
    : null;
    
  const worstMonth = months.length > 0
    ? months.reduce((worst, m) => {
        const pnl = m.endingCapital - m.startingCapital;
        const worstPnl = worst.endingCapital - worst.startingCapital;
        return pnl < worstPnl ? m : worst;
      })
    : null;
  
  // Prepare chart data - last 6 months, sorted by date
  const sortedMonths = [...months]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);
  
  const chartLabels = sortedMonths.map(m => {
    const [year, month] = m.month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[parseInt(month) - 1];
  });
  
  const chartData = sortedMonths.map(m => m.endingCapital - m.startingCapital);
  
  // Calculate cumulative P&L for the line chart
  const cumulativeData = chartData.reduce<number[]>((acc, val) => {
    const last = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(last + val);
    return acc;
  }, []);
  
  const hasChartData = sortedMonths.length >= 2;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            Your trading performance
          </Text>
        </View>
        
        {months.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color={themeColors.textMuted} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Data Yet</Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              Add your first month to see analytics
            </Text>
          </View>
        ) : (
          <>
            {/* P&L Chart */}
            {hasChartData && (
              <View style={[styles.chartCard, { backgroundColor: themeColors.card }]}>
                <View style={styles.chartHeader}>
                  <Text style={[styles.chartTitle, { color: themeColors.text }]}>Cumulative P&L</Text>
                  <Text style={[styles.chartSubtitle, { color: themeColors.textMuted }]}>Last {sortedMonths.length} months</Text>
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
                  width={screenWidth - 72}
                  height={180}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: themeColors.card,
                    backgroundGradientTo: themeColors.card,
                    decimalPlaces: 0,
                    color: () => colors.primary,
                    labelColor: () => themeColors.textMuted,
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                      stroke: colors.primary,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    },
                  }}
                  bezier
                  style={styles.chart}
                  withInnerLines={true}
                  withOuterLines={false}
                />
              </View>
            )}
            
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Total P&L</Text>
                <Text style={[styles.summaryValue, { color: stats.totalProfitLoss >= 0 ? colors.profit : colors.loss }]}>
                  {formatCurrency(stats.totalProfitLoss)}
                </Text>
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Win Rate</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {stats.winRate.toFixed(1)}%
                </Text>
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Avg Return</Text>
                <Text style={[styles.summaryValue, { color: stats.averageReturn >= 0 ? colors.profit : colors.loss }]}>
                  {formatPercentage(stats.averageReturn)}
                </Text>
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Total Months</Text>
                <Text style={[styles.summaryValue, { color: themeColors.text }]}>
                  {months.length}
                </Text>
              </View>
            </View>
            
            {/* Win/Loss Breakdown */}
            <View style={[styles.breakdownCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Win/Loss Breakdown</Text>
              
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <View style={[styles.indicator, { backgroundColor: colors.profit }]} />
                  <Text style={[styles.breakdownLabel, { color: themeColors.textMuted }]}>Profitable</Text>
                  <Text style={[styles.breakdownValue, { color: colors.profit }]}>{profitableMonths}</Text>
                </View>
                
                <View style={styles.breakdownItem}>
                  <View style={[styles.indicator, { backgroundColor: colors.loss }]} />
                  <Text style={[styles.breakdownLabel, { color: themeColors.textMuted }]}>Losing</Text>
                  <Text style={[styles.breakdownValue, { color: colors.loss }]}>{losingMonths}</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      backgroundColor: colors.profit,
                      flex: profitableMonths || 1,
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      backgroundColor: colors.loss,
                      flex: losingMonths || 1,
                    }
                  ]} 
                />
              </View>
            </View>
            
            {/* Best & Worst Month */}
            <View style={[styles.extremesCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Performance Extremes</Text>
              
              {bestMonth && (
                <View style={styles.extremeRow}>
                  <View style={[styles.extremeIcon, { backgroundColor: 'rgba(16, 185, 95, 0.1)' }]}>
                    <Ionicons name="trending-up" size={20} color={colors.profit} />
                  </View>
                  <View style={styles.extremeInfo}>
                    <Text style={[styles.extremeLabel, { color: themeColors.textMuted }]}>Best Month</Text>
                    <Text style={[styles.extremeMonth, { color: themeColors.text }]}>{bestMonth.month}</Text>
                  </View>
                  <Text style={[styles.extremeValue, { color: colors.profit }]}>
                    {formatCurrency(bestMonth.endingCapital - bestMonth.startingCapital)}
                  </Text>
                </View>
              )}
              
              {worstMonth && (
                <View style={[styles.extremeRow, { borderBottomWidth: 0 }]}>
                  <View style={[styles.extremeIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Ionicons name="trending-down" size={20} color={colors.loss} />
                  </View>
                  <View style={styles.extremeInfo}>
                    <Text style={[styles.extremeLabel, { color: themeColors.textMuted }]}>Worst Month</Text>
                    <Text style={[styles.extremeMonth, { color: themeColors.text }]}>{worstMonth.month}</Text>
                  </View>
                  <Text style={[styles.extremeValue, { color: colors.loss }]}>
                    {formatCurrency(worstMonth.endingCapital - worstMonth.startingCapital)}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
        
        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  chartSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  chart: {
    borderRadius: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    rowGap: 12,
  },
  summaryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  breakdownCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  breakdownLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: 4,
  },
  breakdownValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  extremesCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  extremeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  extremeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  extremeInfo: {
    flex: 1,
  },
  extremeLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: 2,
  },
  extremeMonth: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  extremeValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});
