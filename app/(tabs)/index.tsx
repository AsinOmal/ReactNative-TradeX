import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { MonthCard } from '../../src/components/MonthCard';
import { StatCard } from '../../src/components/StatCard';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { formatMonthDisplay, getMonthKey } from '../../src/utils/dateUtils';
import { formatCurrency, formatPercentage } from '../../src/utils/formatters';

export default function HomeScreen() {
  const router = useRouter();
  const { months, stats, isLoading, loadMonths, getRecentMonths } = useTrading();
  const { isDark, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  
  const recentMonths = getRecentMonths(3);
  const currentMonthKey = getMonthKey();
  const currentMonth = months.find(m => m.month === currentMonthKey);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadMonths();
    setRefreshing(false);
  }, [loadMonths]);
  
  const colors = {
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    card: isDark ? '#1F1F23' : '#F4F4F5',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    primary: '#6366F1',
    border: isDark ? '#27272A' : '#E4E4E7',
  };
  
  if (isLoading && months.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <Text style={[styles.text, { color: colors.textMuted }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (months.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Trading P&L
          </Text>
          <TouchableOpacity 
            onPress={toggleTheme}
            style={[styles.themeButton, { backgroundColor: colors.card }]}
          >
            <Ionicons 
              name={isDark ? 'sunny' : 'moon'} 
              size={22} 
              color={isDark ? '#FBBF24' : '#6366F1'} 
            />
          </TouchableOpacity>
        </View>
        <EmptyState
          title="Start Tracking"
          message="Add your first month to start tracking your trading performance"
          actionLabel="Add First Month"
          onAction={() => router.push('/add-month')}
          icon="📈"
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView 
        style={styles.flex1}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#6366F1" 
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Trading P&L
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {formatMonthDisplay(currentMonthKey)}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={toggleTheme}
            style={[styles.themeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons 
              name={isDark ? 'sunny' : 'moon'} 
              size={22} 
              color={isDark ? '#FBBF24' : '#6366F1'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Current Month Card */}
        {currentMonth ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              Current Month
            </Text>
            <MonthCard 
              month={currentMonth} 
              showFullDetails 
              onPress={() => router.push(`/month-details/${currentMonth.id}`)}
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={() => router.push('/add-month')}
          >
            <Text style={[styles.addIcon, { color: colors.primary }]}>+</Text>
            <Text style={[styles.addText, { color: colors.primary }]}>
              Add {formatMonthDisplay(currentMonthKey)} Data
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Overall Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Overall Statistics
          </Text>
          <View style={styles.statsRow}>
            <StatCard
              title="Total P&L"
              value={formatCurrency(stats.totalProfitLoss, true)}
              valueColor={stats.totalProfitLoss >= 0 ? 'profit' : 'loss'}
            />
            <StatCard
              title="Win Rate"
              value={`${stats.winRate.toFixed(0)}%`}
              subtitle={`${stats.profitableMonths}/${stats.totalMonths}`}
              valueColor="primary"
            />
            <StatCard
              title="Avg Return"
              value={formatPercentage(stats.averageReturn, true)}
              valueColor={stats.averageReturn >= 0 ? 'profit' : 'loss'}
            />
          </View>
        </View>
        
        {/* Recent Months */}
        {recentMonths.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Recent Months
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={[styles.link, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentMonths.map(month => (
              <View key={month.id} style={styles.monthCardWrapper}>
                <MonthCard
                  month={month}
                  onPress={() => router.push(`/month-details/${month.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-month')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  themeButton: {
    padding: 12,
    borderRadius: 50,
    borderWidth: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
  },
  monthCardWrapper: {
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
