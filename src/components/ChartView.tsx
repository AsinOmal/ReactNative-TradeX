import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { ChartDataPoint } from '../types';

interface ChartViewProps {
  data: ChartDataPoint[];
  showPercentage?: boolean;
}

export function ChartView({ data, showPercentage = false }: ChartViewProps) {
  const { isDark } = useTheme();
  
  const colors = {
    bg: isDark ? '#1F1F23' : '#F4F4F5',
    border: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#A1A1AA' : '#71717A',
    primary: '#6366F1',
    gridLine: isDark ? '#27272A' : '#E4E4E7',
  };
  
  if (data.length < 2) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Add at least 2 months to see the chart
        </Text>
      </View>
    );
  }
  
  const screenWidth = Dimensions.get('window').width - 48;
  const values = showPercentage 
    ? data.map(d => d.percentage) 
    : data.map(d => d.value);
  const labels = data.map(d => d.label);
  
  const maxLabels = 6;
  const step = Math.ceil(labels.length / maxLabels);
  const displayLabels = labels.map((label, i) => 
    i % step === 0 ? label : ''
  );
  
  const chartData = {
    labels: displayLabels,
    datasets: [
      {
        data: values,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };
  
  const chartConfig = {
    backgroundColor: colors.bg,
    backgroundGradientFrom: colors.bg,
    backgroundGradientTo: colors.bg,
    decimalPlaces: showPercentage ? 1 : 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.gridLine,
      strokeWidth: 1,
    },
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        formatYLabel={(value) => 
          showPercentage ? `${value}%` : `$${parseFloat(value).toLocaleString()}`
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
