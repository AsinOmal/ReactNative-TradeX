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
import { fonts } from '../src/config/fonts';
import { colors } from '../src/config/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useTrading } from '../src/context/TradingContext';
import { MonthRecord } from '../src/types';
import { formatMonthDisplay } from '../src/utils/dateUtils';
import { formatCurrency, formatPercentage } from '../src/utils/formatters';

export default function CompareScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { months } = useTrading();
  
  const [selectedMonth1, setSelectedMonth1] = useState<MonthRecord | null>(null);
  const [selectedMonth2, setSelectedMonth2] = useState<MonthRecord | null>(null);
  const [picking, setPicking] = useState<1 | 2 | null>(null);
  
  const closedMonths = months.filter(m => m.status === 'closed');
  
  const themeColors = {
    bg: isDark ? colors.darkBg : colors.lightBg,
    card: isDark ? colors.darkCard : colors.lightCard,
    border: isDark ? colors.darkBorder : colors.lightBorder,
    text: isDark ? colors.textLight : colors.textDark,
    textMuted: isDark ? colors.textMuted : colors.textMutedLight,
  };
  
  const renderCompareValue = (value1: number, value2: number, formatFn: (v: number) => string) => {
    const diff = value1 - value2;
    const isBetter = value1 > value2;
    
    return (
      <View style={styles.compareRow}>
        <Text style={[
          styles.compareValue,
          { color: isBetter ? colors.profit : value1 < value2 ? colors.loss : themeColors.text }
        ]}>
          {formatFn(value1)}
        </Text>
        <View style={[styles.diffBadge, { backgroundColor: diff >= 0 ? colors.profitAlpha : colors.lossAlpha }]}>
          <Text style={[styles.diffText, { color: diff >= 0 ? colors.profit : colors.loss }]}>
            {diff >= 0 ? '+' : ''}{formatFn(diff)}
          </Text>
        </View>
        <Text style={[
          styles.compareValue,
          { color: !isBetter && value1 !== value2 ? colors.profit : value1 < value2 ? colors.loss : themeColors.text }
        ]}>
          {formatFn(value2)}
        </Text>
      </View>
    );
  };
  
  const handleSelectMonth = (month: MonthRecord) => {
    if (picking === 1) {
      setSelectedMonth1(month);
    } else if (picking === 2) {
      setSelectedMonth2(month);
    }
    setPicking(null);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: themeColors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Compare Months</Text>
        <View style={styles.backButton} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Month Selectors */}
        <View style={styles.selectors}>
          <TouchableOpacity 
            style={[styles.selector, { backgroundColor: themeColors.card, borderColor: picking === 1 ? colors.primary : themeColors.border }]}
            onPress={() => setPicking(1)}
          >
            {selectedMonth1 ? (
              <>
                <Text style={[styles.selectorMonth, { color: themeColors.text }]}>
                  {formatMonthDisplay(selectedMonth1.month)}
                </Text>
                <Text style={[styles.selectorPnL, { color: selectedMonth1.netProfitLoss >= 0 ? colors.profit : colors.loss }]}>
                  {formatCurrency(selectedMonth1.netProfitLoss, true)}
                </Text>
              </>
            ) : (
              <Text style={[styles.selectorPlaceholder, { color: themeColors.textMuted }]}>
                Select Month 1
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={[styles.vsCircle, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.vsText, { color: themeColors.textMuted }]}>VS</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.selector, { backgroundColor: themeColors.card, borderColor: picking === 2 ? colors.primary : themeColors.border }]}
            onPress={() => setPicking(2)}
          >
            {selectedMonth2 ? (
              <>
                <Text style={[styles.selectorMonth, { color: themeColors.text }]}>
                  {formatMonthDisplay(selectedMonth2.month)}
                </Text>
                <Text style={[styles.selectorPnL, { color: selectedMonth2.netProfitLoss >= 0 ? colors.profit : colors.loss }]}>
                  {formatCurrency(selectedMonth2.netProfitLoss, true)}
                </Text>
              </>
            ) : (
              <Text style={[styles.selectorPlaceholder, { color: themeColors.textMuted }]}>
                Select Month 2
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Month Picker */}
        {picking && (
          <View style={[styles.monthPicker, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.pickerTitle, { color: themeColors.textMuted }]}>
              Select Month {picking}
            </Text>
            {closedMonths.map((month) => (
              <TouchableOpacity
                key={month.id}
                style={[styles.monthOption, { borderColor: themeColors.border }]}
                onPress={() => handleSelectMonth(month)}
              >
                <Text style={[styles.monthOptionText, { color: themeColors.text }]}>
                  {formatMonthDisplay(month.month)}
                </Text>
                <Text style={[styles.monthOptionPnL, { color: month.netProfitLoss >= 0 ? colors.profit : colors.loss }]}>
                  {formatCurrency(month.netProfitLoss, true)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Comparison Results */}
        {selectedMonth1 && selectedMonth2 && !picking && (
          <View style={styles.comparison}>
            <Text style={[styles.comparisonTitle, { color: themeColors.textMuted }]}>COMPARISON</Text>
            
            <View style={[styles.comparisonCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>Net P&L</Text>
              {renderCompareValue(selectedMonth1.netProfitLoss, selectedMonth2.netProfitLoss, (v) => formatCurrency(v, true))}
            </View>
            
            <View style={[styles.comparisonCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>Return %</Text>
              {renderCompareValue(selectedMonth1.returnPercentage, selectedMonth2.returnPercentage, (v) => formatPercentage(v, true))}
            </View>
            
            <View style={[styles.comparisonCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>Starting Capital</Text>
              {renderCompareValue(selectedMonth1.startingCapital, selectedMonth2.startingCapital, (v) => formatCurrency(v))}
            </View>
            
            <View style={[styles.comparisonCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>Ending Capital</Text>
              {renderCompareValue(selectedMonth1.endingCapital, selectedMonth2.endingCapital, (v) => formatCurrency(v))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  selectors: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  selector: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  selectorMonth: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginBottom: 4,
  },
  selectorPnL: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  selectorPlaceholder: {
    fontFamily: fonts.medium,
    fontSize: 14,
    paddingVertical: 10,
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  monthPicker: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  pickerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  monthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  monthOptionText: {
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  monthOptionPnL: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  comparison: {
    paddingHorizontal: 20,
  },
  comparisonTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  comparisonCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  metricLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  diffBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  diffText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
});
