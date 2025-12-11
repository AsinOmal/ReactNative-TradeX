import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MonthRecord } from '../types';
import { formatMonthDisplay } from '../utils/dateUtils';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface MonthCardProps {
  month: MonthRecord;
  onPress?: () => void;
  showFullDetails?: boolean;
}

export function MonthCard({ month, onPress, showFullDetails = false }: MonthCardProps) {
  const { isDark } = useTheme();
  const isProfit = month.netProfitLoss >= 0;
  
  const colors = {
    bg: isDark ? '#1F1F23' : '#F4F4F5',
    border: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    profit: '#10B981',
    loss: '#EF4444',
    primary: '#6366F1',
    statusBg: isDark ? '#27272A' : '#E4E4E7',
  };
  
  const content = (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {formatMonthDisplay(month.month)}
        </Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: month.status === 'active' ? 'rgba(99, 102, 241, 0.2)' : colors.statusBg }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: month.status === 'active' ? colors.primary : colors.textMuted }
          ]}>
            {month.status === 'active' ? 'Active' : 'Closed'}
          </Text>
        </View>
      </View>
      
      {showFullDetails ? (
        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Starting</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatCurrency(month.startingCapital)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Ending</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatCurrency(month.endingCapital)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Net P&L</Text>
            <Text style={[styles.detailValue, { color: isProfit ? colors.profit : colors.loss }]}>
              {formatCurrency(month.netProfitLoss, true)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Return</Text>
            <Text style={[styles.detailValue, { color: isProfit ? colors.profit : colors.loss }]}>
              {formatPercentage(month.returnPercentage, true)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.summary}>
          <Text style={[styles.pnl, { color: isProfit ? colors.profit : colors.loss }]}>
            {formatCurrency(month.netProfitLoss, true)}
          </Text>
          <Text style={[styles.returnPct, { color: isProfit ? colors.profit : colors.loss }]}>
            {formatPercentage(month.returnPercentage, true)}
          </Text>
        </View>
      )}
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pnl: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  returnPct: {
    fontSize: 16,
    fontWeight: '600',
  },
});
