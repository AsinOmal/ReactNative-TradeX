import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../src/config/fonts';
import { useTheme } from '../src/context/ThemeContext';
import { useTrading } from '../src/context/TradingContext';
import { createTradeRecord } from '../src/services/tradeCalculationService';
import { TradeFormInput } from '../src/types';
import { fontScale, scale } from '../src/utils/scaling';

export default function EditTradeScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTradeById, updateTrade } = useTrading();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<TradeFormInput>({
    symbol: '',
    tradeType: 'long',
    status: 'closed',
    entryDate: new Date().toISOString().split('T')[0],
    exitDate: new Date().toISOString().split('T')[0],
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    notes: '',
    tags: '',
  });
  
  // Load existing trade data
  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    
    const trade = getTradeById(id);
    if (!trade) {
      Alert.alert('Error', 'Trade not found');
      router.back();
      return;
    }
    
    // Pre-fill form with existing trade data
    setForm({
      symbol: trade.symbol,
      tradeType: trade.tradeType,
      status: trade.status,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate || new Date().toISOString().split('T')[0],
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice?.toString() || '',
      quantity: trade.quantity.toString(),
      notes: trade.notes || '',
      tags: trade.tags.join(', '),
    });
    setIsLoading(false);
  }, [id, getTradeById]);
  
  // Date picker state
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);
  const [showExitDatePicker, setShowExitDatePicker] = useState(false);
  const [tempEntryDate, setTempEntryDate] = useState<Date | null>(null);
  const [tempExitDate, setTempExitDate] = useState<Date | null>(null);
  
  const themeColors = {
    bg: isDark ? '#09090B' : '#FFFFFF',
    card: isDark ? '#18181B' : '#F4F4F5',
    cardBorder: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#FFFFFF' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    inputBg: isDark ? '#1F1F23' : '#FFFFFF',
  };
  
  // Parse date string to Date object
  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  // Format Date object to string
  const formatDateStr = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Handle date change
  const handleEntryDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEntryDatePicker(false);
      if (selectedDate) {
        setForm({ ...form, entryDate: formatDateStr(selectedDate) });
      }
    } else {
      // iOS: just update temp state
      if (selectedDate) {
       setTempEntryDate(selectedDate);
      }
    }
  };
  
  const handleExitDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowExitDatePicker(false);
      if (selectedDate) {
        setForm({ ...form, exitDate: formatDateStr(selectedDate) });
      }
    } else {
      // iOS: just update temp state
      if (selectedDate) {
        setTempExitDate(selectedDate);
      }
    }
  };
  
  // Calculate live P&L preview
  const calculatePreview = () => {
    const entry = parseFloat(form.entryPrice) || 0;
    const exit = parseFloat(form.exitPrice || '0') || 0;
    const qty = parseFloat(form.quantity) || 0;
    
    if (entry === 0 || exit === 0 || qty === 0) {
      return { pnl: 0, returnPct: 0 };
    }
    
    const direction = form.tradeType === 'long' ? 1 : -1;
    const pnl = (exit - entry) * qty * direction;
    const returnPct = ((exit - entry) / entry) * 100 * direction;
    
    return { pnl, returnPct };
  };
  
  const preview = calculatePreview();
  
  // Form validation
  const isValidForm = () => {
    const baseValid = form.symbol.trim() !== '' && 
                      parseFloat(form.entryPrice) > 0 && 
                      parseFloat(form.quantity) > 0;
    
    // For closed trades, also require exit price
    if (form.status === 'closed') {
      return baseValid && parseFloat(form.exitPrice || '0') > 0;
    }
    
    // For open trades, just need entry and quantity
    return baseValid;
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (!isValidForm()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    if (!id) return;
    
    setIsSubmitting(true);
    Keyboard.dismiss();
    
    try {
      const updatedTrade = createTradeRecord(id, form);
      await updateTrade(id, updatedTrade);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Failed to update trade:', error);
      Alert.alert('Error', 'Failed to update trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // iOS Date Picker Modal
  const renderIOSDatePicker = (
    visible: boolean,
    onClose: () => void,
    dateValue: string,
    tempDate: Date | null,
    onChange: (event: DateTimePickerEvent, date?: Date) => void,
    onDone: () => void,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ 
          backgroundColor: themeColors.card, 
          borderTopLeftRadius: scale(24), 
          borderTopRightRadius: scale(24),
          paddingBottom: scale(30),
        }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: scale(20),
            borderBottomWidth: 1,
            borderBottomColor: themeColors.cardBorder,
          }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text }}>{title}</Text>
            <TouchableOpacity onPress={onDone}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: '#FB923C' }}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate || parseDate(dateValue)}
            mode="date"
            display="spinner"
            onChange={onChange}
            textColor={themeColors.text}
            style={{ height: 180 }}
          />
        </View>
      </View>
    </Modal>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
              backgroundColor: themeColors.card,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="close" size={scale(22)} color={themeColors.text} />
          </TouchableOpacity>
          
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: fontScale(18),
            color: themeColors.text,
          }}>
            Edit Trade
          </Text>
          
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !isValidForm()}
            style={{ opacity: isSubmitting || !isValidForm() ? 0.5 : 1 }}
          >
            <LinearGradient
              colors={['#FB923C', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: scale(20),
                paddingVertical: scale(10),
                borderRadius: scale(12),
              }}
            >
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: fontScale(14),
                color: '#FFFFFF',
              }}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: scale(20) }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Symbol Input */}
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ 
              fontFamily: fonts.semiBold, 
              fontSize: fontScale(12), 
              color: themeColors.textMuted, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: scale(10) 
            }}>
              Symbol
            </Text>
            <View style={{
              backgroundColor: themeColors.inputBg,
              borderRadius: scale(14),
              borderWidth: 1,
              borderColor: themeColors.cardBorder,
              paddingHorizontal: scale(16),
              paddingVertical: scale(14),
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="trending-up" size={scale(20)} color={themeColors.textMuted} style={{ marginRight: scale(12) }} />
              <TextInput
                style={{ 
                  flex: 1,
                  fontFamily: fonts.semiBold, 
                  fontSize: fontScale(17), 
                  color: themeColors.text,
                  padding: 0,
                }}
                value={form.symbol}
                onChangeText={(text) => setForm({ ...form, symbol: text.toUpperCase() })}
                placeholder="e.g., AAPL, BTC"
                placeholderTextColor={themeColors.textMuted}
              />
            </View>
          </View>
          
          {/* Trade Type Toggle */}
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ 
              fontFamily: fonts.semiBold, 
              fontSize: fontScale(12), 
              color: themeColors.textMuted, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: scale(10) 
            }}>
              Trade Type
            </Text>
            <View style={{ flexDirection: 'row', gap: scale(12) }}>
              {(['long', 'short'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setForm({ ...form, tradeType: type });
                  }}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={form.tradeType === type 
                      ? (type === 'long' ? ['#10B95F', '#059669'] : ['#EF4444', '#DC2626'])
                      : [themeColors.inputBg, themeColors.inputBg]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: scale(16),
                      borderRadius: scale(14),
                      borderWidth: form.tradeType === type ? 0 : 1,
                      borderColor: themeColors.cardBorder,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons 
                      name={type === 'long' ? 'arrow-up' : 'arrow-down'} 
                      size={scale(18)} 
                      color={form.tradeType === type ? '#FFFFFF' : themeColors.textMuted} 
                      style={{ marginBottom: scale(4) }}
                    />
                    <Text style={{
                      fontFamily: fonts.bold,
                      fontSize: fontScale(14),
                      color: form.tradeType === type ? '#FFFFFF' : themeColors.textMuted,
                      textTransform: 'uppercase',
                    }}>
                      {type}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Status Toggle */}
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ 
              fontFamily: fonts.semiBold, 
              fontSize: fontScale(12), 
              color: themeColors.textMuted, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: scale(10) 
            }}>
              Trade Status
            </Text>
            <View style={{ flexDirection: 'row', gap: scale(12) }}>
              {(['open', 'closed'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setForm({ ...form, status });
                  }}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={form.status === status 
                      ? (status === 'open' ? ['#FB923C', '#F97316'] : ['#10B95F', '#059669'])
                      : [themeColors.inputBg, themeColors.inputBg]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: scale(16),
                      borderRadius: scale(14),
                      borderWidth: form.status === status ? 0 : 1,
                      borderColor: themeColors.cardBorder,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons 
                      name={status === 'open' ? 'time-outline' : 'checkmark-circle-outline'} 
                      size={scale(18)} 
                      color={form.status === status ? '#FFFFFF' : themeColors.textMuted} 
                      style={{ marginBottom: scale(4) }}
                    />
                    <Text style={{
                      fontFamily: fonts.bold,
                      fontSize: fontScale(14),
                      color: form.status === status ? '#FFFFFF' : themeColors.textMuted,
                      textTransform: 'uppercase',
                    }}>
                      {status}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Dates Section */}
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ 
              fontFamily: fonts.semiBold, 
              fontSize: fontScale(12), 
              color: themeColors.textMuted, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: scale(10) 
            }}>
              {form.status === 'open' ? 'Entry Date' : 'Trade Dates'}
            </Text>
            <View style={{ flexDirection: 'row', gap: scale(12) }}>
              <TouchableOpacity
                onPress={() => setShowEntryDatePicker(true)}
                style={{
                  flex: 1,
                  backgroundColor: themeColors.inputBg,
                  borderRadius: scale(14),
                  borderWidth: 1,
                  borderColor: themeColors.cardBorder,
                  padding: scale(16),
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(8) }}>
                  <Ionicons name="log-in-outline" size={scale(16)} color="#10B95F" />
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(11), color: '#10B95F', marginLeft: scale(6), textTransform: 'uppercase' }}>Entry</Text>
                </View>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: themeColors.text }}>
                  {formatDateDisplay(form.entryDate)}
                </Text>
              </TouchableOpacity>
              
              {form.status === 'closed' && (
                <>
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="arrow-forward" size={scale(20)} color={themeColors.textMuted} />
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => setShowExitDatePicker(true)}
                    style={{
                      flex: 1,
                      backgroundColor: themeColors.inputBg,
                      borderRadius: scale(14),
                      borderWidth: 1,
                      borderColor: themeColors.cardBorder,
                      padding: scale(16),
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(8) }}>
                      <Ionicons name="log-out-outline" size={scale(16)} color="#FB923C" />
                      <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(11), color: '#FB923C', marginLeft: scale(6), textTransform: 'uppercase' }}>Exit</Text>
                    </View>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: themeColors.text }}>
                      {formatDateDisplay(form.exitDate || form.entryDate)}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          {/* Prices Section */}
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ 
              fontFamily: fonts.semiBold, 
              fontSize: fontScale(12), 
              color: themeColors.textMuted, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: scale(10) 
            }}>
              {form.status === 'open' ? 'Entry Price' : 'Prices'}
            </Text>
            <View style={{ flexDirection: 'row', gap: scale(12) }}>
              <View style={{ flex: 1 }}>
                <View style={{
                  backgroundColor: themeColors.inputBg,
                  borderRadius: scale(14),
                  borderWidth: 1,
                  borderColor: themeColors.cardBorder,
                  padding: scale(16),
                }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(11), color: '#10B95F', marginBottom: scale(8), textTransform: 'uppercase' }}>Entry Price</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(18), color: themeColors.textMuted, marginRight: scale(4) }}>$</Text>
                    <TextInput
                      style={{ 
                        flex: 1,
                        fontFamily: fonts.semiBold, 
                        fontSize: fontScale(18), 
                        color: themeColors.text,
                        padding: 0,
                      }}
                      value={form.entryPrice}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9.]/g, '');
                        const parts = cleaned.split('.');
                        const valid = parts.length <= 2 ? parts.join('.') : parts[0] + '.' + parts.slice(1).join('');
                        setForm({ ...form, entryPrice: valid });
                      }}
                      placeholder="0.00"
                      placeholderTextColor={themeColors.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
              
              {form.status === 'closed' && (
                <View style={{ flex: 1 }}>
                  <View style={{
                    backgroundColor: themeColors.inputBg,
                    borderRadius: scale(14),
                    borderWidth: 1,
                    borderColor: themeColors.cardBorder,
                    padding: scale(16),
                  }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(11), color: '#FB923C', marginBottom: scale(8), textTransform: 'uppercase' }}>Exit Price</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(18), color: themeColors.textMuted, marginRight: scale(4) }}>$</Text>
                      <TextInput
                        style={{ 
                          flex: 1,
                          fontFamily: fonts.semiBold, 
                          fontSize: fontScale(18), 
                          color: themeColors.text,
                          padding: 0,
                        }}
                        value={form.exitPrice || ''}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9.]/g, '');
                          const parts = cleaned.split('.');
                          const valid = parts.length <= 2 ? parts.join('.') : parts[0] + '.' + parts.slice(1).join('');
                          setForm({ ...form, exitPrice: valid });
                        }}
                        placeholder="0.00"
                        placeholderTextColor={themeColors.textMuted}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
          
          {/* Quantity */}
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ 
              fontFamily: fonts.semiBold, 
              fontSize: fontScale(12), 
              color: themeColors.textMuted, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: scale(10) 
            }}>
              Quantity
            </Text>
            <View style={{
              backgroundColor: themeColors.inputBg,
              borderRadius: scale(14),
              borderWidth: 1,
              borderColor: themeColors.cardBorder,
              paddingHorizontal: scale(16),
              paddingVertical: scale(14),
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="layers-outline" size={scale(20)} color={themeColors.textMuted} style={{ marginRight: scale(12) }} />
              <TextInput
                style={{ 
                  flex: 1,
                  fontFamily: fonts.semiBold, 
                  fontSize: fontScale(17), 
                  color: themeColors.text,
                  padding: 0,
                }}
                value={form.quantity}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  const valid = parts.length <= 2 ? parts.join('.') : parts[0] + '.' + parts.slice(1).join('');
                  setForm({ ...form, quantity: valid });
                }}
                placeholder="0"
                placeholderTextColor={themeColors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          {/* P&L Preview */}
          {form.status === 'closed' && form.entryPrice && form.exitPrice && form.quantity && (
            <View style={{ marginBottom: scale(24) }}>
              <LinearGradient
                colors={preview.pnl >= 0 ? ['rgba(16, 185, 95, 0.15)', 'rgba(16, 185, 95, 0.05)'] : ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: scale(16),
                  padding: scale(20),
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: preview.pnl >= 0 ? 'rgba(16, 185, 95, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <Text style={{
                  fontFamily: fonts.medium,
                  fontSize: fontScale(12),
                  color: themeColors.textMuted,
                  marginBottom: scale(6),
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  Estimated P&L
                </Text>
                <Text style={{
                  fontFamily: fonts.extraBold,
                  fontSize: fontScale(32),
                  color: preview.pnl >= 0 ? '#10B95F' : '#EF4444',
                }}>
                  {preview.pnl >= 0 ? '+' : ''}${Math.abs(preview.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={{
                  fontFamily: fonts.semiBold,
                  fontSize: fontScale(15),
                  color: preview.pnl >= 0 ? '#10B95F' : '#EF4444',
                }}>
                  {preview.returnPct >= 0 ? '+' : ''}{preview.returnPct.toFixed(2)}%
                </Text>
              </LinearGradient>
            </View>
          )}
          
          {/* Tags */}
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ 
              fontFamily: fonts.semiBold, 
              fontSize: fontScale(12), 
              color: themeColors.textMuted, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: scale(10) 
            }}>
              Tags (optional)
            </Text>
            <View style={{
              backgroundColor: themeColors.inputBg,
              borderRadius: scale(14),
              borderWidth: 1,
              borderColor: themeColors.cardBorder,
              paddingHorizontal: scale(16),
              paddingVertical: scale(14),
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="pricetag-outline" size={scale(20)} color={themeColors.textMuted} style={{ marginRight: scale(12) }} />
              <TextInput
                style={{ 
                  flex: 1,
                  fontFamily: fonts.regular, 
                  fontSize: fontScale(15), 
                  color: themeColors.text,
                  padding: 0,
                }}
                value={form.tags}
                onChangeText={(text) => setForm({ ...form, tags: text })}
                placeholder="swing, earnings, breakout..."
                placeholderTextColor={themeColors.textMuted}
              />
            </View>
          </View>
          
          {/* Notes */}
          <View style={{ marginBottom: scale(24) }}>
            <Text style={{ 
              fontFamily: fonts.semiBold, 
              fontSize: fontScale(12), 
              color: themeColors.textMuted, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: scale(10) 
            }}>
              Notes (optional)
            </Text>
            <View style={{
              backgroundColor: themeColors.inputBg,
              borderRadius: scale(14),
              borderWidth: 1,
              borderColor: themeColors.cardBorder,
              padding: scale(16),
              minHeight: scale(100),
            }}>
              <TextInput
                style={{ 
                  fontFamily: fonts.regular, 
                  fontSize: fontScale(15), 
                  color: themeColors.text,
                  padding: 0,
                  textAlignVertical: 'top',
                }}
                value={form.notes}
                onChangeText={(text) => setForm({ ...form, notes: text })}
                placeholder="Trade observations, lessons learned..."
                placeholderTextColor={themeColors.textMuted}
                multiline
              />
            </View>
          </View>
          
          {/* Extra padding for keyboard */}
          <View style={{ height: scale(60) }} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* iOS Date Pickers */}
      {Platform.OS === 'ios' && (
        <>
          {renderIOSDatePicker(
            showEntryDatePicker,
            () => setShowEntryDatePicker(false),
            form.entryDate,
            tempEntryDate,
            handleEntryDateChange,
            () => {
              if (tempEntryDate) {
                setForm({ ...form, entryDate: formatDateStr(tempEntryDate) });
              }
              setShowEntryDatePicker(false);
              setTempEntryDate(null);
            },
            'Entry Date'
          )}
          {renderIOSDatePicker(
            showExitDatePicker,
            () => setShowExitDatePicker(false),
            form.exitDate || form.entryDate,
            tempExitDate,
            handleExitDateChange,
            () => {
              if (tempExitDate) {
                setForm({ ...form, exitDate: formatDateStr(tempExitDate) });
              }
              setShowExitDatePicker(false);
              setTempExitDate(null);
            },
            'Exit Date'
          )}
        </>
      )}
      
      {/* Android Date Pickers */}
      {Platform.OS === 'android' && showEntryDatePicker && (
        <DateTimePicker
          value={parseDate(form.entryDate)}
          mode="date"
          display="default"
                onChange={(e, selectedDate) => handleEntryDateChange(e, selectedDate || new Date())}
        />
      )}
      {Platform.OS === 'android' && showExitDatePicker && (
        <DateTimePicker
          value={parseDate(form.exitDate || form.entryDate)}
          mode="date"
          display="default"
          onChange={handleExitDateChange}
        />
      )}
    </SafeAreaView>
  );
}
