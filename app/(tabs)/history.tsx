import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { MonthCard } from '../../src/components/MonthCard';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { sortMonthsDesc } from '../../src/utils/dateUtils';

export default function HistoryScreen() {
  const router = useRouter();
  const { months } = useTrading();
  const { isDark } = useTheme();
  
  const sortedMonths = [...months].sort((a, b) => sortMonthsDesc(a.month, b.month));
  
  const colors = {
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
  };
  
  if (months.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            History
          </Text>
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          History
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {months.length} months recorded
        </Text>
      </View>
      
      <FlatList
        data={sortedMonths}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.monthCardWrapper}>
            <MonthCard
              month={item}
              onPress={() => router.push(`/month-details/${item.id}`)}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  monthCardWrapper: {
    marginBottom: 12,
  },
});
