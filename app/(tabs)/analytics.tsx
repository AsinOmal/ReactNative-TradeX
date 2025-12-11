import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartView } from '../../src/components/ChartView';
import { EmptyState } from '../../src/components/EmptyState';
import { StatCard } from '../../src/components/StatCard';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { calculateOverallStats, filterMonthsByRange, getChartData } from '../../src/services/calculationService';
import { formatMonthDisplay } from '../../src/utils/dateUtils';
import { formatCurrency, formatPercentage } from '../../src/utils/formatters';

type TimeRange = '6M' | '1Y' | 'ALL';

export default function AnalyticsScreen() {
  const { months } = useTrading();
  const { isDark } = useTheme();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('ALL');
  const [showPercentage, setShowPercentage] = useState(false);
  
  const filteredMonths = filterMonthsByRange(months, selectedRange);
  const chartData = getChartData(filteredMonths);
  const stats = calculateOverallStats(filteredMonths);
  
  const colors = {
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    card: isDark ? '#1F1F23' : '#F4F4F5',
    border: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    primary: '#6366F1',
    profit: '#10B981',
    loss: '#EF4444',
  };
  
  if (months.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Analytics
          </Text>
        </View>
        <EmptyState
          title="No Data Yet"
          message="Start adding monthly data to see your performance analytics"
          icon="📊"
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.flex1} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Analytics
          </Text>
        </View>
        
        {/* Time Range Selector */}
        <View style={[styles.rangeContainer, { backgroundColor: colors.card }]}>
          {(['6M', '1Y', 'ALL'] as TimeRange[]).map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.rangeButton,
                selectedRange === range && styles.rangeButtonActive
              ]}
              onPress={() => setSelectedRange(range)}
            >
              <Text style={[
                styles.rangeText,
                { color: selectedRange === range ? '#FFFFFF' : colors.textMuted }
              ]}>
                {range === 'ALL' ? 'All Time' : range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              Performance Chart
            </Text>
            <TouchableOpacity 
              style={[styles.toggleButton, { backgroundColor: colors.card }]}
              onPress={() => setShowPercentage(!showPercentage)}
            >
              <Text style={[styles.toggleText, { color: colors.text }]}>
                {showPercentage ? 'Show $' : 'Show %'}
              </Text>
            </TouchableOpacity>
          </View>
          <ChartView data={chartData} showPercentage={showPercentage} />
        </View>
        
        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Performance Metrics
          </Text>
          
          <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total P&L</Text>
              <Text style={[styles.metricValue, { color: stats.totalProfitLoss >= 0 ? colors.profit : colors.loss }]}>
                {formatCurrency(stats.totalProfitLoss, true)}
              </Text>
            </View>
            
            <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Avg Monthly Return</Text>
              <Text style={[styles.metricValue, { color: stats.averageReturn >= 0 ? colors.profit : colors.loss }]}>
                {formatPercentage(stats.averageReturn, true)}
              </Text>
            </View>
            
            <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Best Month</Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.profit }]}>
                  {stats.bestMonth ? formatCurrency(stats.bestMonth.netProfitLoss, true) : 'N/A'}
                </Text>
                {stats.bestMonth && (
                  <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                    {formatMonthDisplay(stats.bestMonth.month)}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Worst Month</Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.loss }]}>
                  {stats.worstMonth ? formatCurrency(stats.worstMonth.netProfitLoss, true) : 'N/A'}
                </Text>
                {stats.worstMonth && (
                  <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                    {formatMonthDisplay(stats.worstMonth.month)}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Profitable Months</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {stats.profitableMonths} / {stats.totalMonths}
              </Text>
            </View>
            
            <View style={styles.metricRowLast}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Win Rate</Text>
              <Text style={[styles.metricValue, { color: stats.winRate >= 50 ? colors.profit : colors.loss }]}>
                {stats.winRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
        
        {/* Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Summary
          </Text>
          <View style={styles.statsRow}>
            <StatCard
              title="Total Profits"
              value={formatCurrency(stats.totalProfit)}
              valueColor="profit"
            />
            <StatCard
              title="Total Losses"
              value={formatCurrency(stats.totalLoss)}
              valueColor="loss"
            />
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
  flex1: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  rangeContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 4,
    borderRadius: 12,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  rangeButtonActive: {
    backgroundColor: '#6366F1',
  },
  rangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  metricRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricValueContainer: {
    alignItems: 'flex-end',
  },
  metricSub: {
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
