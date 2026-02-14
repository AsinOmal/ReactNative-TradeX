import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import { MonthPicker } from '../src/components/MonthPicker';
import { fonts } from '../src/config/fonts';
import { colors } from '../src/config/theme';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { useTrading } from '../src/context/TradingContext';
import { calculateMonthMetrics, createMonthRecord } from '../src/services/calculationService';
import { formatMonthDisplay, getMonthKey } from '../src/utils/dateUtils';
import { formatCurrency, formatCurrencyInput, formatPercentage, parseCurrency } from '../src/utils/formatters';
import { validateMonthForm } from '../src/utils/validators';

export default function AddMonthScreen() {
  const router = useRouter();
  const { months, addMonth, monthExists, getTradesByMonth } = useTrading();
  const { isDark } = useTheme();
  
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [startingCapital, setStartingCapital] = useState('');
  const [endingCapital, setEndingCapital] = useState('');
  const [deposits, setDeposits] = useState('');
  const [withdrawals, setWithdrawals] = useState('');
  const [notes, setNotes] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const existingMonths = months.map((m) => m.month);
  
  // Check if selected month has trades
  const tradesForMonth = getTradesByMonth(selectedMonth);
  const hasTradesForMonth = tradesForMonth.length > 0;
  
  const calculations = useMemo(() => {
    const start = parseCurrency(startingCapital);
    const end = parseCurrency(endingCapital);
    const dep = parseCurrency(deposits);
    const with_ = parseCurrency(withdrawals);
    
    if (start > 0 && end >= 0) {
      return calculateMonthMetrics(start, end, with_, dep);
    }
    return null;
  }, [startingCapital, endingCapital, deposits, withdrawals]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    let error = '';
    const numValue = parseCurrency(value);

    switch (field) {
      case 'startingCapital':
        if (!value) error = 'Required';
        else if (numValue <= 0) error = 'Must be > 0';
        break;
      case 'endingCapital':
        if (!value) error = 'Required';
        else if (numValue < 0) error = 'Cannot be negative';
        break;
      case 'deposits':
      case 'withdrawals':
        if (value && numValue < 0) error = 'Cannot be negative';
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleSave = async () => {
    const start = parseCurrency(startingCapital);
    const end = parseCurrency(endingCapital);
    const dep = parseCurrency(deposits);
    const with_ = parseCurrency(withdrawals);
    
    // Validate all fields
    const startValid = validateField('startingCapital', startingCapital);
    const endValid = validateField('endingCapital', endingCapital);
    const depValid = validateField('deposits', deposits);
    const withValid = validateField('withdrawals', withdrawals);

    if (!startValid || !endValid || !depValid || !withValid) {
      Alert.alert('Validation Error', 'Please correct the errors in the form.');
      return;
    }
    
    const validation = validateMonthForm(start, end, with_, dep, selectedMonth);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }
    
    const exists = await monthExists(selectedMonth);
    if (exists) {
      Alert.alert('Month Exists', 'A record for this month already exists.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const record = createMonthRecord(
        uuidv4(),
        selectedMonth,
        start,
        end,
        with_,
        dep,
        notes,
        'closed'
      );
      
      await addMonth(record);
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save month. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeColors = {
    bg: isDark ? colors.darkBg : colors.lightBg,
    card: isDark ? colors.darkCard : colors.lightCard,
    text: isDark ? colors.textLight : colors.textDark,
    textMuted: isDark ? colors.textMuted : colors.textMutedLight,
    border: isDark ? colors.darkBorder : colors.lightBorder,
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    summaryBg: isDark ? 'rgba(16, 185, 95, 0.08)' : 'rgba(16, 185, 95, 0.05)',
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(2,0,36,0)', 'rgba(16, 185, 95, 0.05)']
            : ['rgba(255,255,255,0)', 'rgba(16, 185, 95, 0.05)']
        }
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="close" size={22} color={themeColors.text} />
          </TouchableOpacity>
          
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: themeColors.text }}>
            New Month
          </Text>
          
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting || !calculations}
            style={{ opacity: isSubmitting || !calculations ? 0.5 : 1 }}
          >
            <LinearGradient
              colors={['#10B95F', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF' }}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Month Selector Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <TouchableOpacity 
              style={styles.monthSelector}
              onPress={() => setShowMonthPicker(true)}
            >
              <View style={styles.monthSelectorLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primaryAlpha }]}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.monthLabel, { color: themeColors.textMuted }]}>Month</Text>
                  <Text style={[styles.monthValue, { color: themeColors.text }]}>
                    {formatMonthDisplay(selectedMonth)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>
          
          {/* Warning if month has trades */}
          {hasTradesForMonth && (
            <View style={{
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(251, 191, 36, 0.3)',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <Ionicons name="warning" size={24} color="#FBBF24" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#FBBF24', marginBottom: 4 }}>
                  This month has {tradesForMonth.length} trade{tradesForMonth.length > 1 ? 's' : ''}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: themeColors.textMuted, lineHeight: 18 }}>
                  Trade P&L will be used for this month's stats. Manual P&L entry here will be ignored to prevent double-counting.
                </Text>
              </View>
            </View>
          )}
          
          {/* Capital Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99, 102, 241, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="wallet-outline" size={18} color="#6366F1" />
              </View>
              <Text style={[styles.cardTitle, { color: themeColors.text, marginBottom: 0 }]}>Capital</Text>
            </View>
            
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Starting Balance</Text>
              <View style={[
                styles.inputField,
                { backgroundColor: themeColors.inputBg, borderColor: errors.startingCapital ? colors.loss : 'transparent' },
                errors.startingCapital && styles.inputError
              ]}>
                <Text style={[styles.currencySymbol, { color: themeColors.textMuted }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={startingCapital}
                  onChangeText={(text) => {
                    setStartingCapital(formatCurrencyInput(text));
                    if (errors.startingCapital) validateField('startingCapital', text);
                  }}
                  onBlur={() => validateField('startingCapital', startingCapital)}
                  placeholder="0.00"
                  placeholderTextColor={themeColors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              {errors.startingCapital && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={colors.loss} />
                  <Text style={styles.errorText}>{errors.startingCapital}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Ending Balance</Text>
              <View style={[
                styles.inputField,
                { backgroundColor: themeColors.inputBg, borderColor: errors.endingCapital ? colors.loss : 'transparent' },
                errors.endingCapital && styles.inputError
              ]}>
                <Text style={[styles.currencySymbol, { color: themeColors.textMuted }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={endingCapital}
                  onChangeText={(text) => {
                    setEndingCapital(formatCurrencyInput(text));
                    if (errors.endingCapital) validateField('endingCapital', text);
                  }}
                  onBlur={() => validateField('endingCapital', endingCapital)}
                  placeholder="0.00"
                  placeholderTextColor={themeColors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              {errors.endingCapital && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={colors.loss} />
                  <Text style={styles.errorText}>{errors.endingCapital}</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Transfers Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(16, 185, 95, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="swap-vertical-outline" size={18} color="#10B95F" />
              </View>
              <Text style={[styles.cardTitle, { color: themeColors.text, marginBottom: 0 }]}>Transfers</Text>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="arrow-down-circle" size={18} color={colors.profit} />
                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Deposits</Text>
              </View>
              <View style={[styles.inputField, { backgroundColor: themeColors.inputBg, borderColor: 'transparent' }]}>
                <Text style={[styles.currencySymbol, { color: themeColors.textMuted }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={deposits}
                  onChangeText={(text) => setDeposits(formatCurrencyInput(text))}
                  placeholder="0.00"
                  placeholderTextColor={themeColors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="arrow-up-circle" size={18} color={colors.loss} />
                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Withdrawals</Text>
              </View>
              <View style={[styles.inputField, { backgroundColor: themeColors.inputBg, borderColor: 'transparent' }]}>
                <Text style={[styles.currencySymbol, { color: themeColors.textMuted }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={withdrawals}
                  onChangeText={(text) => setWithdrawals(formatCurrencyInput(text))}
                  placeholder="0.00"
                  placeholderTextColor={themeColors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          
          {/* Live Summary */}
          {calculations && (
            <LinearGradient
              colors={calculations.netProfitLoss >= 0 
                ? ['rgba(16, 185, 95, 0.15)', 'rgba(16, 185, 95, 0.05)'] 
                : ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 24,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: calculations.netProfitLoss >= 0 ? 'rgba(16, 185, 95, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
                Estimated P&L
              </Text>
              
              <Text style={{ 
                fontFamily: fonts.extraBold, 
                fontSize: 36, 
                color: calculations.netProfitLoss >= 0 ? colors.profit : colors.loss, 
                textAlign: 'center',
                marginBottom: 4,
              }}>
                {formatCurrency(calculations.netProfitLoss, true)}
              </Text>
              
              <Text style={{ 
                fontFamily: fonts.semiBold, 
                fontSize: 16, 
                color: calculations.returnPercentage >= 0 ? colors.profit : colors.loss, 
                textAlign: 'center',
              }}>
                {formatPercentage(calculations.returnPercentage, true)}
              </Text>
            </LinearGradient>
          )}
          
          {/* Notes Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(251, 191, 36, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={18} color="#FBBF24" />
              </View>
              <Text style={[styles.cardTitle, { color: themeColors.text, marginBottom: 0 }]}>Notes</Text>
            </View>
            <TextInput
              style={[styles.textArea, { backgroundColor: themeColors.inputBg, color: themeColors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this month..."
              placeholderTextColor={themeColors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.spacer} />
        </ScrollView>
        
        <MonthPicker
          visible={showMonthPicker}
          selectedMonth={selectedMonth}
          onSelect={setSelectedMonth}
          onClose={() => setShowMonthPicker(false)}
          disabledMonths={existingMonths}
        />
      </KeyboardAvoidingView>
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
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: fonts.regular,
  },
  monthValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: fonts.semiBold,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: fonts.medium,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
    borderWidth: 1,
  },
  inputError: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  currencySymbol: {
    fontSize: 20,
    marginRight: 8,
    fontWeight: '500',
    fontFamily: fonts.medium,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
    padding: 0,
    fontFamily: fonts.medium,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  errorText: {
    fontSize: 12,
    color: colors.loss,
    fontWeight: '500',
    fontFamily: fonts.medium,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 20,
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  textArea: {
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  spacer: {
    height: 40,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
});
