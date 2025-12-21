import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fonts } from '../config/fonts';
import { useTheme } from '../context/ThemeContext';
import { MonthRecord } from '../types';
import { formatMonthDisplay } from '../utils/dateUtils';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { fontScale, scale } from '../utils/scaling';
import { PrivacyAwareText } from './PrivacyAwareText';

interface MonthCardProps {
  month: MonthRecord;
  onPress?: () => void;
  showFullDetails?: boolean;
  tradeCount?: number;
}

export function MonthCard({ month, onPress, showFullDetails = false, tradeCount = 0 }: MonthCardProps) {
  const { isDark } = useTheme();
  const isProfit = month.netProfitLoss >= 0;
  
  const colors = {
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#A1A1AA' : '#71717A',
    profit: '#10B95F',
    loss: '#EF4444',
    primary: '#6366F1',
  };

  // Gradient colors based on profit/loss
  const gradientColors = isProfit 
    ? (isDark ? ['rgba(16, 185, 95, 0.15)', 'rgba(16, 185, 95, 0.05)'] : ['rgba(16, 185, 95, 0.12)', 'rgba(16, 185, 95, 0.04)'])
    : (isDark ? ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)'] : ['rgba(239, 68, 68, 0.12)', 'rgba(239, 68, 68, 0.04)']);

  const borderColor = isProfit ? 'rgba(16, 185, 95, 0.2)' : 'rgba(239, 68, 68, 0.2)';
  
  const content = (
    <LinearGradient
      colors={gradientColors as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderColor }]}
    >
      {/* Decorative Bubbles */}
      <View style={[styles.bubble, styles.bubble1, { backgroundColor: isProfit ? 'rgba(16, 185, 95, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]} />
      <View style={[styles.bubble, styles.bubble2, { backgroundColor: isProfit ? 'rgba(16, 185, 95, 0.08)' : 'rgba(239, 68, 68, 0.08)' }]} />
      <View style={[styles.bubble, styles.bubble3, { backgroundColor: isProfit ? 'rgba(16, 185, 95, 0.06)' : 'rgba(239, 68, 68, 0.06)' }]} />
      
      {/* Status Badge - Top Right */}
      <Text style={[
        { 
          position: 'absolute',
          top: scale(16),
          right: scale(16),
          zIndex: 10,
          fontSize: fontScale(13),
          fontFamily: fonts.extraBold,
          color: month.status === 'active' ? '#3B82F6' : colors.textMuted,
        }
      ]}>
        {month.status === 'active' ? 'Active' : 'Closed'}
      </Text>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: scale(8), paddingRight: scale(70) }}>
          <Text style={[styles.monthTitle, { color: colors.text, fontFamily: fonts.extraBold }]}>
            {formatMonthDisplay(month.month)}
          </Text>
          
          {/* Trade Count Badge */}
          {tradeCount > 0 && (
            <View style={styles.tradeBadge}>
              <Ionicons name="swap-horizontal" size={scale(11)} color="#10B95F" />
              <Text style={styles.tradeBadgeText}>{tradeCount}</Text>
            </View>
          )}
          
          {/* P&L Source Badge */}
          {month.pnlSource === 'trades' && (
            <View style={styles.autoBadge}>
              <Text style={styles.autoBadgeText}>AUTO</Text>
            </View>
          )}
        </View>
      </View>
      
      {showFullDetails ? (
        // Full Details View (This Month card)
        <View style={styles.details}>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted, fontFamily: fonts.medium }]}>Starting</Text>
              <PrivacyAwareText 
                value={month.startingCapital}
                format={formatCurrency}
                style={[styles.metricValue, { color: colors.text, fontFamily: fonts.semiBold }]}
              />
            </View>
            <View style={[styles.metricItem, { alignItems: 'flex-end' }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted, fontFamily: fonts.medium }]}>Ending</Text>
              <PrivacyAwareText 
                value={month.endingCapital}
                format={formatCurrency}
                style={[styles.metricValue, { color: colors.text, fontFamily: fonts.semiBold }]}
              />
            </View>
          </View>
          
          {/* P&L Highlight */}
          <View style={styles.pnlCard}>
            <View style={styles.pnlRow}>
              <View>
                <Text style={[styles.pnlLabel, { color: colors.textMuted, fontFamily: fonts.medium }]}>Net P&L</Text>
                <PrivacyAwareText 
                  value={month.netProfitLoss}
                  format={(val) => formatCurrency(val, true)}
                  style={[styles.pnlValueLarge, { color: isProfit ? colors.profit : colors.loss, fontFamily: fonts.extraBold }]}
                />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.pnlLabel, { color: colors.textMuted, fontFamily: fonts.medium }]}>Return</Text>
                <View style={[
                  styles.returnPill, 
                  { backgroundColor: isProfit ? 'rgba(16, 185, 95, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                ]}>
                  <Ionicons 
                    name={isProfit ? 'trending-up' : 'trending-down'} 
                    size={scale(16)} 
                    color={isProfit ? colors.profit : colors.loss} 
                  />
                  <PrivacyAwareText 
                    value={month.returnPercentage}
                    format={(val) => formatPercentage(val, true)}
                    style={[styles.returnText, { color: isProfit ? colors.profit : colors.loss, fontFamily: fonts.bold }]}
                    maskedValue="•••"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // Summary View (Recent Performance cards)
        <View style={styles.summary}>
          <PrivacyAwareText 
            value={month.netProfitLoss}
            format={(val) => formatCurrency(val, true)}
            style={[styles.pnl, { color: isProfit ? colors.profit : colors.loss, fontFamily: fonts.extraBold }]}
          />
          <View style={[
            styles.returnPillSmall,
            { backgroundColor: isProfit ? 'rgba(16, 185, 95, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
          ]}>
            <Ionicons 
              name={isProfit ? 'trending-up' : 'trending-down'} 
              size={scale(14)} 
              color={isProfit ? colors.profit : colors.loss} 
            />
            <PrivacyAwareText 
              value={month.returnPercentage}
              format={(val) => formatPercentage(val, true)}
              style={[styles.returnPct, { color: isProfit ? colors.profit : colors.loss, fontFamily: fonts.semiBold }]}
              maskedValue="•••"
            />
          </View>
        </View>
      )}
    </LinearGradient>
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
    borderRadius: scale(20),
    padding: scale(20),
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  // Decorative bubbles
  bubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  bubble1: {
    width: scale(100),
    height: scale(100),
    top: -scale(30),
    right: -scale(20),
  },
  bubble2: {
    width: scale(60),
    height: scale(60),
    bottom: scale(20),
    right: scale(40),
  },
  bubble3: {
    width: scale(40),
    height: scale(40),
    top: scale(50),
    left: -scale(15),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
    zIndex: 1,
  },
  monthTitle: {
    fontSize: fontScale(18),
  },
  tradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 95, 0.15)',
    paddingHorizontal: scale(7),
    paddingVertical: scale(3),
    borderRadius: scale(8),
    gap: scale(3),
  },
  tradeBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#10B95F',
  },
  autoBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: scale(7),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  autoBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
    borderRadius: scale(14),
  },
  statusText: {
    fontSize: fontScale(12),
  },
  details: {
    gap: scale(16),
    zIndex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    gap: scale(4),
  },
  metricLabel: {
    fontSize: fontScale(11),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: fontScale(17),
  },
  pnlCard: {
    borderRadius: scale(14),
    paddingTop: scale(12),
  },
  pnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pnlLabel: {
    fontSize: fontScale(11),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: scale(4),
  },
  pnlValueLarge: {
    fontSize: fontScale(26),
  },
  returnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(12),
  },
  returnText: {
    fontSize: fontScale(16),
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  pnl: {
    fontSize: fontScale(22),
  },
  returnPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(10),
  },
  returnPct: {
    fontSize: fontScale(14),
  },
});
