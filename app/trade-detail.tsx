import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../src/config/fonts';
import { useTheme } from '../src/context/ThemeContext';
import { useTrading } from '../src/context/TradingContext';
import { fontScale, scale } from '../src/utils/scaling';

export default function TradeDetailScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTradeById, deleteTrade } = useTrading();
  
  const trade = getTradeById(id || '');
  
  const themeColors = {
    bg: isDark ? '#09090B' : '#FFFFFF',
    card: isDark ? '#18181B' : '#F4F4F5',
    cardBorder: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#FFFFFF' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
  };
  
  if (!trade) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: themeColors.textMuted }}>
          Trade not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: scale(16) }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: '#10B95F' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Trade',
      `Are you sure you want to delete this ${trade.symbol} trade?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrade(trade.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete trade');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push({ pathname: '/edit-trade', params: { id: trade.id } });
  };
  
  const isWin = trade.pnl > 0;
  const isLoss = trade.pnl < 0;
  const accentColor = isWin ? '#10B95F' : isLoss ? '#EF4444' : '#71717A';
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingVertical: scale(16),
      }}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ 
            width: scale(40), 
            height: scale(40), 
            borderRadius: scale(12),
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={scale(22)} color={themeColors.text} />
        </TouchableOpacity>
        
        <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: themeColors.text }}>
          Trade Details
        </Text>
        
        <View style={{ flexDirection: 'row', gap: scale(4) }}>
          <TouchableOpacity 
            onPress={handleEdit}
            style={{ 
              padding: scale(8),
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="pencil" size={scale(22)} color="#FB923C" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDelete}
            style={{ 
              padding: scale(8),
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="trash" size={scale(22)} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: scale(20) }} showsVerticalScrollIndicator={false}>
        {/* Hero P&L Card */}
        <LinearGradient
          colors={isWin 
            ? ['rgba(16, 185, 95, 0.15)', 'rgba(16, 185, 95, 0.05)'] 
            : isLoss 
              ? ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']
              : ['rgba(113, 113, 122, 0.15)', 'rgba(113, 113, 122, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: scale(24),
            padding: scale(28),
            marginBottom: scale(24),
            borderWidth: 1,
            borderColor: isWin ? 'rgba(16, 185, 95, 0.2)' : isLoss ? 'rgba(239, 68, 68, 0.2)' : 'rgba(113, 113, 122, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            alignItems: 'center',
          }}
        >
          {/* Decorative Background Elements */}
          <View style={{ position: 'absolute', top: -30, right: -30, width: scale(120), height: scale(120), borderRadius: scale(60), backgroundColor: isWin ? 'rgba(16, 185, 95, 0.1)' : isLoss ? 'rgba(239, 68, 68, 0.1)' : 'rgba(113, 113, 122, 0.1)' }} />
          <View style={{ position: 'absolute', bottom: -40, left: -20, width: scale(100), height: scale(100), borderRadius: scale(50), backgroundColor: isWin ? 'rgba(16, 185, 95, 0.08)' : isLoss ? 'rgba(239, 68, 68, 0.08)' : 'rgba(113, 113, 122, 0.08)' }} />
          
          {/* Symbol & Type */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(12), marginBottom: scale(16) }}>
            <Text style={{ fontFamily: fonts.extraBold, fontSize: fontScale(28), color: themeColors.text }}>
              {trade.symbol}
            </Text>
            <View style={{
              paddingHorizontal: scale(12),
              paddingVertical: scale(6),
              borderRadius: scale(8),
              backgroundColor: trade.tradeType === 'long' ? 'rgba(16, 185, 95, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: fontScale(11),
                color: trade.tradeType === 'long' ? '#10B95F' : '#EF4444',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {trade.tradeType}
              </Text>
            </View>
          </View>
          
          {/* P&L Display */}
          <Text style={{
            fontFamily: fonts.extraBold,
            fontSize: fontScale(44),
            color: accentColor,
            marginBottom: scale(4),
          }}>
            {formatCurrency(trade.pnl)}
          </Text>
          <Text style={{
            fontFamily: fonts.semiBold,
            fontSize: fontScale(18),
            color: accentColor,
          }}>
            {trade.returnPercentage >= 0 ? '+' : ''}{trade.returnPercentage.toFixed(2)}%
          </Text>
          
          {/* Result Badge */}
          <View style={{
            marginTop: scale(16),
            paddingHorizontal: isWin ? scale(12) : scale(16),
            paddingVertical: scale(8),
            borderRadius: scale(20),
            backgroundColor: accentColor,
          }}>
            {isWin ? (
              <Ionicons name="trophy" size={scale(18)} color="#FFFFFF" />
            ) : (
              <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(12), color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 }}>
                {isLoss ? 'Loss' : 'Break Even'}
              </Text>
            )}
          </View>
        </LinearGradient>
        
        {/* Trade Details Section */}
        <View style={{ marginBottom: scale(24) }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(12), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: scale(12) }}>
            Trade Details
          </Text>
          <View style={{
            backgroundColor: themeColors.card,
            borderRadius: scale(16),
            padding: scale(4),
            borderWidth: 1,
            borderColor: themeColors.cardBorder,
          }}>
            {/* Entry Row */}
            <View style={{ flexDirection: 'row', padding: scale(16), borderBottomWidth: 1, borderBottomColor: themeColors.cardBorder }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: '#10B95F', marginBottom: scale(4) }}>ENTRY</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(17), color: themeColors.text }}>${trade.entryPrice.toFixed(2)}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(13), color: themeColors.textMuted, marginTop: scale(2) }}>{formatDate(trade.entryDate)}</Text>
              </View>
              <View style={{ justifyContent: 'center', paddingHorizontal: scale(12) }}>
                <Ionicons name="arrow-forward" size={scale(20)} color={themeColors.textMuted} />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: '#FB923C', marginBottom: scale(4) }}>EXIT</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(17), color: themeColors.text }}>${trade.exitPrice.toFixed(2)}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(13), color: themeColors.textMuted, marginTop: scale(2) }}>{formatDate(trade.exitDate)}</Text>
              </View>
            </View>
            
            {/* Quantity & Month Row */}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, padding: scale(16), borderRightWidth: 1, borderRightColor: themeColors.cardBorder }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted, marginBottom: scale(4) }}>QUANTITY</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(17), color: themeColors.text }}>{trade.quantity}</Text>
              </View>
              <View style={{ flex: 1, padding: scale(16) }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted, marginBottom: scale(4) }}>MONTH</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(17), color: themeColors.text }}>{trade.monthKey}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Tags */}
        {trade.tags.length > 0 && (
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(12), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: scale(12) }}>
              Tags
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) }}>
              {trade.tags.map((tag, idx) => (
                <View key={idx} style={{
                  paddingHorizontal: scale(14),
                  paddingVertical: scale(8),
                  borderRadius: scale(10),
                  backgroundColor: isDark ? 'rgba(251, 146, 60, 0.15)' : 'rgba(251, 146, 60, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(251, 146, 60, 0.2)',
                }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(13), color: '#FB923C' }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Notes */}
        {trade.notes && (
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(12), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: scale(12) }}>
              Notes
            </Text>
            <View style={{
              backgroundColor: themeColors.card,
              borderRadius: scale(16),
              padding: scale(16),
              borderWidth: 1,
              borderColor: themeColors.cardBorder,
            }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(15), color: themeColors.text, lineHeight: fontScale(24) }}>
                {trade.notes}
              </Text>
            </View>
          </View>
        )}
        
        {/* Timestamps */}
        <View style={{ alignItems: 'center', paddingTop: scale(16), opacity: 0.6 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: themeColors.textMuted }}>
            Created: {new Date(trade.createdAt).toLocaleString()}
          </Text>
          {trade.updatedAt !== trade.createdAt && (
            <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: themeColors.textMuted, marginTop: scale(4) }}>
              Updated: {new Date(trade.updatedAt).toLocaleString()}
            </Text>
          )}
        </View>
        
        <View style={{ height: scale(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
}
