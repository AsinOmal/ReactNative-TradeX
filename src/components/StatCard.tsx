import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  valueColor?: 'profit' | 'loss' | 'primary' | 'default';
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  valueColor = 'default',
}: StatCardProps) {
  const { isDark } = useTheme();
  
  const colors = {
    bg: isDark ? '#1F1F23' : '#F4F4F5',
    border: isDark ? '#27272A' : '#E4E4E7',
    titleText: isDark ? '#71717A' : '#A1A1AA',
    valueText: isDark ? '#F4F4F5' : '#18181B',
    subtitleText: isDark ? '#52525B' : '#71717A',
    profit: '#10B981',
    loss: '#EF4444',
    primary: '#6366F1',
  };
  
  const getValueColor = () => {
    switch (valueColor) {
      case 'profit': return colors.profit;
      case 'loss': return colors.loss;
      case 'primary': return colors.primary;
      default: return colors.valueText;
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.titleText }]}>
        {title}
      </Text>
      <Text style={[styles.value, { color: getValueColor() }]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.subtitleText }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
    borderWidth: 1,
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
  },
});
