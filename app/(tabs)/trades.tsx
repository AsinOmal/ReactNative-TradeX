import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../src/config/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { Trade } from '../../src/types';
import { fontScale, scale } from '../../src/utils/scaling';

type FilterType = 'all' | 'wins' | 'losses';

export default function TradesScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { trades, tradeStats, isLoadingTrades, loadMonths } = useTrading();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const themeColors = {
    bg: isDark ? '#09090B' : '#FFFFFF',
    card: isDark ? '#18181B' : '#F4F4F5',
    cardBorder: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#FFFFFF' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMonths();
    setRefreshing(false);
  };
  
  // Filter trades
  const filteredTrades = trades.filter(trade => {
    if (filter === 'wins') return trade.pnl > 0;
    if (filter === 'losses') return trade.pnl < 0;
    return true;
  }).sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime());
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Render streak badge (only show if 3+ consecutive)
  const renderStreakBadge = () => {
    const streak = tradeStats.currentStreak;
    const count = Math.abs(streak);
    
    if (count < 3) return null;
    
    const isWin = streak > 0;
    
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(10),
        paddingVertical: scale(4),
        borderRadius: scale(12),
        backgroundColor: isWin ? 'rgba(16, 185, 95, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        gap: scale(4),
      }}>
        <Ionicons 
          name={isWin ? 'flame' : 'snow'} 
          size={scale(14)} 
          color={isWin ? '#10B95F' : '#EF4444'} 
        />
        <Text style={{
          fontFamily: fonts.semiBold,
          fontSize: fontScale(12),
          color: isWin ? '#10B95F' : '#EF4444',
        }}>
          {count} {isWin ? 'Win' : 'Loss'} Streak
        </Text>
      </View>
    );
  };
  
  // Render trade card
  const renderTradeCard = ({ item }: { item: Trade }) => {
    const isWin = item.pnl > 0;
    const isLoss = item.pnl < 0;
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/trade-detail?id=${item.id}`)}
        style={{
          backgroundColor: themeColors.card,
          borderRadius: scale(16),
          padding: scale(16),
          marginBottom: scale(12),
          borderWidth: 1,
          borderColor: themeColors.cardBorder,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Left: Symbol & Type */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: fontScale(18),
                color: themeColors.text,
              }}>
                {item.symbol}
              </Text>
              <View style={{
                paddingHorizontal: scale(8),
                paddingVertical: scale(2),
                borderRadius: scale(6),
                backgroundColor: item.tradeType === 'long' ? 'rgba(16, 185, 95, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              }}>
                <Text style={{
                  fontFamily: fonts.medium,
                  fontSize: fontScale(10),
                  color: item.tradeType === 'long' ? '#10B95F' : '#EF4444',
                  textTransform: 'uppercase',
                }}>
                  {item.tradeType}
                </Text>
              </View>
            </View>
            
            <Text style={{
              fontFamily: fonts.regular,
              fontSize: fontScale(13),
              color: themeColors.textMuted,
              marginTop: scale(4),
            }}>
              {formatDate(item.entryDate)} → {formatDate(item.exitDate)}
            </Text>
            
            <Text style={{
              fontFamily: fonts.regular,
              fontSize: fontScale(12),
              color: themeColors.textMuted,
              marginTop: scale(2),
            }}>
              ${item.entryPrice.toFixed(2)} → ${item.exitPrice.toFixed(2)} × {item.quantity}
            </Text>
          </View>
          
          {/* Right: P&L */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{
              fontFamily: fonts.bold,
              fontSize: fontScale(18),
              color: isWin ? '#10B95F' : isLoss ? '#EF4444' : themeColors.text,
            }}>
              {formatCurrency(item.pnl)}
            </Text>
            <Text style={{
              fontFamily: fonts.medium,
              fontSize: fontScale(12),
              color: isWin ? '#10B95F' : isLoss ? '#EF4444' : themeColors.textMuted,
            }}>
              {item.returnPercentage >= 0 ? '+' : ''}{item.returnPercentage.toFixed(1)}%
            </Text>
          </View>
        </View>
        
        {/* Tags */}
        {item.tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: scale(6), marginTop: scale(10) }}>
            {item.tags.map((tag, idx) => (
              <View key={idx} style={{
                paddingHorizontal: scale(8),
                paddingVertical: scale(3),
                borderRadius: scale(6),
                backgroundColor: isDark ? 'rgba(113, 113, 122, 0.2)' : 'rgba(161, 161, 170, 0.2)',
              }}>
                <Text style={{
                  fontFamily: fonts.medium,
                  fontSize: fontScale(11),
                  color: themeColors.textMuted,
                }}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  // Empty state
  const renderEmptyState = () => (
    <ScrollView 
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: scale(20), paddingTop: scale(40) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FB923C" />}
    >
      <LinearGradient
        colors={isDark ? ['rgba(251, 146, 60, 0.12)', 'rgba(251, 146, 60, 0.03)'] : ['rgba(251, 146, 60, 0.08)', 'rgba(251, 146, 60, 0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ 
          borderRadius: scale(24),
          padding: scale(28),
          borderWidth: 1,
          borderColor: 'rgba(251, 146, 60, 0.15)',
          alignItems: 'center',
        }}
      >
        {/* Glowing Icon Container */}
        <View style={{ 
          width: scale(72), 
          height: scale(72), 
          borderRadius: scale(22), 
          backgroundColor: '#FB923C',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: scale(20),
          shadowColor: '#FB923C',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 20,
          elevation: 10,
        }}>
          <Ionicons name="swap-horizontal" size={scale(36)} color="#FFFFFF" />
        </View>
        
        <Text style={{ 
          fontFamily: fonts.bold, 
          fontSize: fontScale(24), 
          color: themeColors.text, 
          marginBottom: scale(10),
          textAlign: 'center',
        }}>
          No Trades Yet
        </Text>
        
        <Text style={{ 
          fontFamily: fonts.regular, 
          fontSize: fontScale(15), 
          color: themeColors.textMuted, 
          lineHeight: fontScale(24), 
          textAlign: 'center',
          marginBottom: scale(28),
          paddingHorizontal: scale(10),
        }}>
          Log individual trades to track performance, analyze by symbol, and see win/loss streaks.
        </Text>
        
        <TouchableOpacity
          onPress={() => router.push('/add-trade')}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={['#FB923C', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: scale(15),
              borderRadius: scale(14),
              alignItems: 'center',
              shadowColor: '#FB923C',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: '#FFFFFF' }}>Add First Trade</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingTop: scale(8),
        paddingBottom: scale(16),
      }}>
        <Text style={{
          fontFamily: fonts.bold,
          fontSize: fontScale(32),
          color: themeColors.text,
        }}>
          Trades
        </Text>
      </View>
      
      {isLoadingTrades ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FB923C" />
        </View>
      ) : trades.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredTrades}
          renderItem={renderTradeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingBottom: scale(120),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FB923C" />}
          ListHeaderComponent={() => (
            <>
              {/* Hero P&L Card */}
              <View style={{ marginBottom: scale(20) }}>
                <LinearGradient
                  colors={tradeStats.totalPnL >= 0 ? ['#FB923C', '#F97316'] : ['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ 
                    borderRadius: scale(24), 
                    padding: scale(24), 
                    overflow: 'hidden',
                    shadowColor: tradeStats.totalPnL >= 0 ? '#FB923C' : '#EF4444',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 12
                  }}
                >
                  {/* Decorative circles */}
                  <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <View style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: 'rgba(255,255,255,0.8)', marginBottom: scale(4) }}>Total Trade P&L</Text>
                  <Text style={{ fontFamily: fonts.extraBold, fontSize: fontScale(38), color: '#FFFFFF', marginBottom: scale(16) }}>
                    {formatCurrency(tradeStats.totalPnL)}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: scale(24) }}>
                    <View>
                      <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: 'rgba(255,255,255,0.7)' }}>Win Rate</Text>
                      <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }}>{tradeStats.winRate.toFixed(0)}%</Text>
                    </View>
                    <View>
                      <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: 'rgba(255,255,255,0.7)' }}>Trades</Text>
                      <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }}>{tradeStats.totalTrades}</Text>
                    </View>
                    <View>
                      <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: 'rgba(255,255,255,0.7)' }}>Profit Factor</Text>
                      <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: '#FFFFFF' }}>
                        {tradeStats.profitFactor === Infinity ? '∞' : tradeStats.profitFactor.toFixed(1)}x
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
              
              {/* Streak Badge */}
              {Math.abs(tradeStats.currentStreak) >= 3 && (
                <View style={{ marginBottom: scale(16) }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: tradeStats.currentStreak > 0 ? 'rgba(16, 185, 95, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: scale(14), 
                    padding: scale(14), 
                    gap: scale(10),
                    borderWidth: 1,
                    borderColor: tradeStats.currentStreak > 0 ? 'rgba(16, 185, 95, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  }}>
                    <Ionicons 
                      name={tradeStats.currentStreak > 0 ? 'flame' : 'snow'} 
                      size={scale(22)} 
                      color={tradeStats.currentStreak > 0 ? '#10B95F' : '#EF4444'} 
                    />
                    <Text style={{ 
                      fontFamily: fonts.semiBold, 
                      fontSize: fontScale(14), 
                      color: tradeStats.currentStreak > 0 ? '#10B95F' : '#EF4444',
                      flex: 1,
                    }}>
                      {Math.abs(tradeStats.currentStreak)} Trade {tradeStats.currentStreak > 0 ? 'Win' : 'Loss'} Streak!
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Filter Bar */}
              <View style={{
                flexDirection: 'row',
                marginBottom: scale(16),
                gap: scale(8),
              }}>
                {(['all', 'wins', 'losses'] as FilterType[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={{
                      paddingVertical: scale(10),
                      paddingHorizontal: scale(18),
                      borderRadius: scale(12),
                      backgroundColor: filter === f 
                        ? (f === 'wins' ? 'rgba(16, 185, 95, 0.15)' : f === 'losses' ? 'rgba(239, 68, 68, 0.15)' : themeColors.card)
                        : 'transparent',
                      borderWidth: 1,
                      borderColor: filter === f ? 'transparent' : themeColors.cardBorder,
                    }}
                  >
                    <Text style={{
                      fontFamily: fonts.semiBold,
                      fontSize: fontScale(13),
                      color: filter === f 
                        ? (f === 'wins' ? '#10B95F' : f === 'losses' ? '#EF4444' : themeColors.text)
                        : themeColors.textMuted,
                      textTransform: 'capitalize',
                    }}>
                      {f} ({f === 'wins' ? tradeStats.winningTrades : f === 'losses' ? tradeStats.losingTrades : tradeStats.totalTrades})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Section Label */}
              <Text style={{ 
                fontFamily: fonts.semiBold, 
                fontSize: fontScale(13), 
                color: themeColors.textMuted, 
                textTransform: 'uppercase', 
                letterSpacing: 1, 
                marginBottom: scale(12) 
              }}>
                Recent Trades
              </Text>
            </>
          )}
        />
      )}
    </SafeAreaView>
  );
}
