import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { fonts } from '../../src/config/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { formatMonthDisplay, sortMonthsDesc } from '../../src/utils/dateUtils';
import { fontScale, scale } from '../../src/utils/scaling';

type FilterType = 'all' | 'profit' | 'loss';

export default function HistoryScreen() {
  const router = useRouter();
  const { months } = useTrading();
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');
  
  const themeColors = {
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    card: isDark ? '#1F1F23' : '#FFFFFF',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    border: isDark ? '#27272A' : '#E4E4E7',
  };
  
  const colors = {
    profit: '#10B95F',
    loss: '#EF4444',
    profitLight: 'rgba(16, 185, 95, 0.15)',
    lossLight: 'rgba(239, 68, 68, 0.15)',
  };
  
  // Filter and sort months
  const filteredMonths = [...months]
    .filter(m => {
      if (filter === 'profit') return m.netProfitLoss > 0;
      if (filter === 'loss') return m.netProfitLoss < 0;
      return true;
    })
    .sort((a, b) => sortMonthsDesc(a.month, b.month));
  
  // Group months by year
  const groupedByYear = filteredMonths.reduce<Record<string, typeof filteredMonths>>((groups, month) => {
    const year = month.month.split('-')[0];
    if (!groups[year]) groups[year] = [];
    groups[year].push(month);
    return groups;
  }, {});
  
  const years = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));
  
  // Calculate stats
  const totalProfit = months.reduce((sum, m) => sum + (m.netProfitLoss > 0 ? m.netProfitLoss : 0), 0);
  const totalLoss = months.reduce((sum, m) => sum + (m.netProfitLoss < 0 ? Math.abs(m.netProfitLoss) : 0), 0);
  const profitCount = months.filter(m => m.netProfitLoss > 0).length;
  const lossCount = months.filter(m => m.netProfitLoss < 0).length;
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };
  
  if (months.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: themeColors.bg }}>
        <View style={{ paddingHorizontal: scale(20), paddingTop: scale(16), paddingBottom: scale(20) }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(32), color: themeColors.text }}>History</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(15), color: themeColors.textMuted, marginTop: scale(4) }}>Your trading records</Text>
        </View>
        <EmptyState
          title="No History"
          message="Your monthly trading records will appear here"
          actionLabel="Add First Month"
          onAction={() => router.push('/add-month')}
          icon="📅"
        />
      </SafeAreaView>
    );
  }
  
  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <TouchableOpacity
      onPress={() => setFilter(type)}
      style={{
        paddingHorizontal: scale(16),
        paddingVertical: scale(10),
        borderRadius: scale(12),
        backgroundColor: filter === type 
          ? (type === 'profit' ? colors.profitLight : type === 'loss' ? colors.lossLight : 'rgba(99, 102, 241, 0.15)')
          : 'transparent',
        borderWidth: 1,
        borderColor: filter === type 
          ? (type === 'profit' ? colors.profit : type === 'loss' ? colors.loss : '#6366F1')
          : themeColors.border,
      }}
    >
      <Text style={{ 
        fontFamily: fonts.semiBold, 
        fontSize: fontScale(13), 
        color: filter === type 
          ? (type === 'profit' ? colors.profit : type === 'loss' ? colors.loss : '#6366F1')
          : themeColors.textMuted 
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: scale(20), paddingTop: scale(16), paddingBottom: scale(16) }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(32), color: themeColors.text }}>History</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(15), color: themeColors.textMuted, marginTop: scale(4) }}>
          {months.length} months recorded
        </Text>
      </View>
      
      {/* Stats Cards */}
      <View style={{ flexDirection: 'row', paddingHorizontal: scale(20), gap: scale(12), marginBottom: scale(16) }}>
        <View style={{ flex: 1, backgroundColor: colors.profitLight, borderRadius: scale(16), padding: scale(16) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(8) }}>
            <Ionicons name="trending-up" size={scale(18)} color={colors.profit} />
            <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: colors.profit }}>Total Gain</Text>
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: colors.profit }}>{formatCurrency(totalProfit)}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: themeColors.textMuted, marginTop: scale(4) }}>{profitCount} months</Text>
        </View>
        
        <View style={{ flex: 1, backgroundColor: colors.lossLight, borderRadius: scale(16), padding: scale(16) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(8) }}>
            <Ionicons name="trending-down" size={scale(18)} color={colors.loss} />
            <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: colors.loss }}>Total Loss</Text>
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: colors.loss }}>-{formatCurrency(totalLoss)}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: themeColors.textMuted, marginTop: scale(4) }}>{lossCount} months</Text>
        </View>
      </View>
      
      {/* Filter Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: scale(20), gap: scale(8), marginBottom: scale(20) }}>
        <FilterButton type="all" label="All" />
        <FilterButton type="profit" label="Winning" />
        <FilterButton type="loss" label="Losing" />
      </View>
      
      {/* Months List Grouped by Year */}
      <FlatList
        data={years}
        keyExtractor={(year) => year}
        renderItem={({ item: year }) => (
          <View style={{ marginBottom: scale(24) }}>
            {/* Year Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), marginBottom: scale(12), gap: scale(12) }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: themeColors.text }}>{year}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: themeColors.border }} />
              <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: themeColors.textMuted }}>
                {groupedByYear[year].length} months
              </Text>
            </View>
            
            {/* Month Cards */}
            {groupedByYear[year].map((month) => (
              <TouchableOpacity
                key={month.id}
                onPress={() => router.push(`/month-details/${month.id}`)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: themeColors.card,
                  marginHorizontal: scale(20),
                  marginBottom: scale(10),
                  padding: scale(16),
                  borderRadius: scale(16),
                  borderWidth: 1,
                  borderColor: themeColors.border,
                }}
              >
                {/* Month Icon */}
                <LinearGradient
                  colors={month.netProfitLoss >= 0 ? ['#10B95F', '#059669'] : ['#EF4444', '#DC2626']}
                  style={{ width: scale(44), height: scale(44), borderRadius: scale(12), justifyContent: 'center', alignItems: 'center', marginRight: scale(14) }}
                >
                  <Ionicons 
                    name={month.netProfitLoss >= 0 ? 'arrow-up' : 'arrow-down'} 
                    size={scale(22)} 
                    color="#FFFFFF" 
                  />
                </LinearGradient>
                
                {/* Month Details */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text }}>
                    {formatMonthDisplay(month.month)}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(13), color: themeColors.textMuted, marginTop: scale(2) }}>
                    {month.status === 'closed' ? 'Closed' : 'Active'}
                  </Text>
                </View>
                
                {/* P&L */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(17), color: month.netProfitLoss >= 0 ? colors.profit : colors.loss }}>
                    {month.netProfitLoss >= 0 ? '+' : ''}{formatCurrency(month.netProfitLoss)}
                  </Text>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted, marginTop: scale(2) }}>
                    {month.returnPercentage >= 0 ? '+' : ''}{month.returnPercentage.toFixed(1)}%
                  </Text>
                </View>
                
                {/* Arrow */}
                <Ionicons name="chevron-forward" size={scale(18)} color={themeColors.textMuted} style={{ marginLeft: scale(8) }} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: scale(140) }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: scale(60), paddingHorizontal: scale(40) }}>
            <Ionicons name="search" size={scale(48)} color={themeColors.textMuted} style={{ marginBottom: scale(16) }} />
            <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(18), color: themeColors.text, marginBottom: scale(8), textAlign: 'center' }}>
              No {filter === 'profit' ? 'winning' : 'losing'} months
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(14), color: themeColors.textMuted, textAlign: 'center' }}>
              Try changing the filter
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
