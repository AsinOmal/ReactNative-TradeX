import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { v4 as uuidv4 } from 'uuid';
import { fonts } from '../src/config/fonts';
import { useTheme } from '../src/context/ThemeContext';
import { useTrading } from '../src/context/TradingContext';
import { createTradeRecord } from '../src/services/tradeCalculationService';
import { TradeFormInput } from '../src/types';
import { fontScale, scale } from '../src/utils/scaling';

// Input styles helper
const getInputStyles = (isDark: boolean) => ({
  bg: isDark ? '#09090B' : '#FFFFFF',
  card: isDark ? '#18181B' : '#F4F4F5',
  cardBorder: isDark ? '#27272A' : '#E4E4E7',
  text: isDark ? '#FFFFFF' : '#18181B',
  textMuted: isDark ? '#71717A' : '#A1A1AA',
  inputBg: isDark ? '#27272A' : '#FFFFFF',
});

export default function AddTradeScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { addTrade } = useTrading();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<TradeFormInput>({
    symbol: '',
    tradeType: 'long',
    entryDate: new Date().toISOString().split('T')[0],
    exitDate: new Date().toISOString().split('T')[0],
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    notes: '',
    tags: '',
  });
  
  // Date picker state
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);
  const [showExitDatePicker, setShowExitDatePicker] = useState(false);
  
  const themeColors = getInputStyles(isDark);
  
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
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Handle date change
  const handleEntryDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEntryDatePicker(false);
    }
    if (selectedDate) {
      setForm({ ...form, entryDate: formatDateStr(selectedDate) });
    }
  };
  
  const handleExitDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowExitDatePicker(false);
    }
    if (selectedDate) {
      setForm({ ...form, exitDate: formatDateStr(selectedDate) });
    }
  };
  
  // Calculate live P&L preview
  const calculatePreview = () => {
    const entry = parseFloat(form.entryPrice) || 0;
    const exit = parseFloat(form.exitPrice) || 0;
    const qty = parseFloat(form.quantity) || 0;
    const direction = form.tradeType === 'long' ? 1 : -1;
    const pnl = (exit - entry) * qty * direction;
    const returnPct = entry > 0 ? ((exit - entry) / entry) * 100 * direction : 0;
    return { pnl, returnPct };
  };
  
  const preview = calculatePreview();
  
  const handleSubmit = async () => {
    // Validation
    if (!form.symbol.trim()) {
      Alert.alert('Error', 'Please enter a symbol');
      return;
    }
    if (!form.entryPrice || parseFloat(form.entryPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid entry price');
      return;
    }
    if (!form.exitPrice || parseFloat(form.exitPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid exit price');
      return;
    }
    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    setIsSubmitting(true);
    Keyboard.dismiss();
    
    try {
      const trade = createTradeRecord(uuidv4(), form);
      await addTrade(trade);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Add trade error:', error);
      Alert.alert('Error', 'Failed to save trade');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // iOS Date Picker Modal
  const renderIOSDatePicker = (
    show: boolean, 
    onClose: () => void, 
    value: string, 
    onChange: (event: DateTimePickerEvent, date?: Date) => void,
    title: string
  ) => (
    <Modal visible={show} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderTopLeftRadius: scale(20),
          borderTopRightRadius: scale(20),
          paddingBottom: scale(40),
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: scale(16),
            borderBottomWidth: 1,
            borderBottomColor: themeColors.cardBorder,
          }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: '#EF4444' }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text }}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: '#10B95F' }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={parseDate(value)}
            mode="date"
            display="spinner"
            onChange={onChange}
            themeVariant={isDark ? 'dark' : 'light'}
            style={{ height: 200 }}
          />
        </View>
      </View>
    </Modal>
  );
  
  // Input label style
  const labelStyle = {
    fontFamily: fonts.semiBold,
    fontSize: fontScale(12),
    color: themeColors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: scale(8),
  };
  
  // Input field style
  const inputStyle = {
    backgroundColor: themeColors.inputBg,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: themeColors.cardBorder,
    padding: scale(14),
    fontFamily: fonts.regular,
    fontSize: fontScale(16),
    color: themeColors.text,
  };
  
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
          borderBottomWidth: 1,
          borderBottomColor: themeColors.cardBorder,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: scale(4) }}
          >
            <Ionicons name="close" size={scale(28)} color={themeColors.text} />
          </TouchableOpacity>
          
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: fontScale(18),
            color: themeColors.text,
          }}>
            Add Trade
          </Text>
          
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: '#10B95F',
              paddingHorizontal: scale(16),
              paddingVertical: scale(8),
              borderRadius: scale(8),
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            <Text style={{
              fontFamily: fonts.semiBold,
              fontSize: fontScale(14),
              color: '#FFFFFF',
            }}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: scale(20) }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Symbol */}
          <View style={{ marginBottom: scale(16) }}>
            <Text style={labelStyle}>Symbol</Text>
            <TextInput
              style={inputStyle}
              value={form.symbol}
              onChangeText={(text) => setForm({ ...form, symbol: text.toUpperCase() })}
              placeholder="e.g., AAPL, BTC"
              placeholderTextColor={themeColors.textMuted}
            />
          </View>
          
          {/* Trade Type Toggle */}
          <View style={{ marginBottom: scale(16) }}>
            <Text style={labelStyle}>Trade Type</Text>
            <View style={{ flexDirection: 'row', gap: scale(12) }}>
              {(['long', 'short'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setForm({ ...form, tradeType: type });
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: scale(14),
                    borderRadius: scale(12),
                    borderWidth: 2,
                    borderColor: form.tradeType === type 
                      ? (type === 'long' ? '#10B95F' : '#EF4444')
                      : themeColors.cardBorder,
                    backgroundColor: form.tradeType === type
                      ? (type === 'long' ? 'rgba(16, 185, 95, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                      : themeColors.inputBg,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontFamily: fonts.bold,
                    fontSize: fontScale(14),
                    color: form.tradeType === type
                      ? (type === 'long' ? '#10B95F' : '#EF4444')
                      : themeColors.textMuted,
                    textTransform: 'uppercase',
                  }}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Dates Row */}
          <View style={{ flexDirection: 'row', gap: scale(12) }}>
            <View style={{ flex: 1, marginBottom: scale(16) }}>
              <Text style={labelStyle}>Entry Date</Text>
              <TouchableOpacity
                onPress={() => setShowEntryDatePicker(true)}
                style={{
                  ...inputStyle,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(15), color: themeColors.text }}>
                  {formatDateDisplay(form.entryDate)}
                </Text>
                <Ionicons name="calendar-outline" size={scale(18)} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginBottom: scale(16) }}>
              <Text style={labelStyle}>Exit Date</Text>
              <TouchableOpacity
                onPress={() => setShowExitDatePicker(true)}
                style={{
                  ...inputStyle,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(15), color: themeColors.text }}>
                  {formatDateDisplay(form.exitDate)}
                </Text>
                <Ionicons name="calendar-outline" size={scale(18)} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Prices Row */}
          <View style={{ flexDirection: 'row', gap: scale(12) }}>
            <View style={{ flex: 1, marginBottom: scale(16) }}>
              <Text style={labelStyle}>Entry Price</Text>
              <TextInput
                style={inputStyle}
                value={form.entryPrice}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  // Only allow one decimal point
                  const parts = cleaned.split('.');
                  const valid = parts.length <= 2 ? parts.join('.') : parts[0] + '.' + parts.slice(1).join('');
                  setForm({ ...form, entryPrice: valid });
                }}
                placeholder="0.00"
                placeholderTextColor={themeColors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, marginBottom: scale(16) }}>
              <Text style={labelStyle}>Exit Price</Text>
              <TextInput
                style={inputStyle}
                value={form.exitPrice}
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
          
          {/* Quantity */}
          <View style={{ marginBottom: scale(16) }}>
            <Text style={labelStyle}>Quantity</Text>
            <TextInput
              style={inputStyle}
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
          
          {/* P&L Preview */}
          {form.entryPrice && form.exitPrice && form.quantity && (
            <View style={{
              backgroundColor: preview.pnl >= 0 ? 'rgba(16, 185, 95, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: scale(12),
              padding: scale(16),
              marginBottom: scale(16),
              alignItems: 'center',
            }}>
              <Text style={{
                fontFamily: fonts.regular,
                fontSize: fontScale(12),
                color: themeColors.textMuted,
                marginBottom: scale(4),
              }}>
                Estimated P&L
              </Text>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: fontScale(28),
                color: preview.pnl >= 0 ? '#10B95F' : '#EF4444',
              }}>
                {preview.pnl >= 0 ? '+' : ''}${preview.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={{
                fontFamily: fonts.medium,
                fontSize: fontScale(14),
                color: preview.pnl >= 0 ? '#10B95F' : '#EF4444',
              }}>
                {preview.returnPct >= 0 ? '+' : ''}{preview.returnPct.toFixed(2)}%
              </Text>
            </View>
          )}
          
          {/* Tags */}
          <View style={{ marginBottom: scale(16) }}>
            <Text style={labelStyle}>Tags (comma separated)</Text>
            <TextInput
              style={inputStyle}
              value={form.tags}
              onChangeText={(text) => setForm({ ...form, tags: text })}
              placeholder="e.g., swing, earnings, breakout"
              placeholderTextColor={themeColors.textMuted}
            />
          </View>
          
          {/* Notes */}
          <View style={{ marginBottom: scale(16) }}>
            <Text style={labelStyle}>Notes</Text>
            <TextInput
              style={{ ...inputStyle, minHeight: scale(80), textAlignVertical: 'top' }}
              value={form.notes}
              onChangeText={(text) => setForm({ ...form, notes: text })}
              placeholder="Trade notes, observations..."
              placeholderTextColor={themeColors.textMuted}
              multiline
            />
          </View>
          
          {/* Extra padding for keyboard */}
          <View style={{ height: scale(80) }} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* iOS Date Pickers */}
      {Platform.OS === 'ios' && (
        <>
          {renderIOSDatePicker(
            showEntryDatePicker,
            () => setShowEntryDatePicker(false),
            form.entryDate,
            handleEntryDateChange,
            'Entry Date'
          )}
          {renderIOSDatePicker(
            showExitDatePicker,
            () => setShowExitDatePicker(false),
            form.exitDate,
            handleExitDateChange,
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
          onChange={handleEntryDateChange}
        />
      )}
      {Platform.OS === 'android' && showExitDatePicker && (
        <DateTimePicker
          value={parseDate(form.exitDate)}
          mode="date"
          display="default"
          onChange={handleExitDateChange}
        />
      )}
    </SafeAreaView>
  );
}
