import { Ionicons } from '@expo/vector-icons';
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
    View
} from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import { MonthPicker } from '../src/components/MonthPicker';
import { fonts } from '../src/config/fonts';
import { colors } from '../src/config/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useTrading } from '../src/context/TradingContext';
import { calculateMonthMetrics, createMonthRecord } from '../src/services/calculationService';
import { formatMonthDisplay, getMonthKey } from '../src/utils/dateUtils';
import { formatCurrency, formatCurrencyInput, formatPercentage, parseCurrency } from '../src/utils/formatters';
import { validateMonthForm } from '../src/utils/validators';

export default function AddMonthScreen() {
  const router = useRouter();
  const { months, addMonth, monthExists } = useTrading();
  const { isDark } = useTheme();
  
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [startingCapital, setStartingCapital] = useState('');
  const [endingCapital, setEndingCapital] = useState('');
  const [deposits, setDeposits] = useState('');
  const [withdrawals, setWithdrawals] = useState('');
  const [notes, setNotes] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const existingMonths = months.map(m => m.month);
  
  const themeColors = {
    bg: isDark ? colors.darkBg : colors.lightBg,
    card: isDark ? colors.darkCard : colors.lightCard,
    border: isDark ? colors.darkBorder : colors.lightBorder,
    text: isDark ? colors.textLight : colors.textDark,
    textMuted: isDark ? colors.textMuted : colors.textMutedLight,
  };
  
  const calculations = useMemo(() => {
    const start = parseCurrency(startingCapital);
    const end = parseCurrency(endingCapital);
    const dep = parseCurrency(deposits);
    const with_ = parseCurrency(withdrawals);
    
    if (start > 0 && end >= 0) {
      return calculateMonthMetrics(start, end, dep, with_);
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

    setErrors(prev => ({ ...prev, [field]: error }));
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
    
    const validation = validateMonthForm(start, end, dep, with_, selectedMonth);
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
        dep,
        with_,
        notes,
        'closed'
      );
      
      await addMonth(record);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save month. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            New Month
          </Text>
          <View style={styles.headerSpacer} />
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
          
          {/* Capital Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Capital</Text>
            
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Starting</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={[styles.inputField, { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderColor: errors.startingCapital ? colors.loss : 'transparent',
                  borderWidth: 1
                }]}>
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
                    keyboardType="decimal-pad"
                  />
                </View>
                {errors.startingCapital ? (
                  <Text style={{ color: colors.loss, fontSize: 12, marginTop: 4 }}>{errors.startingCapital}</Text>
                ) : null}
              </View>
            </View>
            
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Ending</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={[styles.inputField, { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderColor: errors.endingCapital ? colors.loss : 'transparent',
                  borderWidth: 1
                }]}>
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
                    keyboardType="decimal-pad"
                  />
                </View>
                {errors.endingCapital ? (
                  <Text style={{ color: colors.loss, fontSize: 12, marginTop: 4 }}>{errors.endingCapital}</Text>
                ) : null}
              </View>
            </View>
          </View>
          
          {/* Transfers Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Transfers</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="arrow-down-circle" size={16} color={colors.profit} />
                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Deposits</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
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
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="arrow-up-circle" size={16} color={colors.loss} />
                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Withdrawals</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
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
          </View>
          
          {/* Live Summary */}
          {calculations && (
            <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(16, 185, 95, 0.08)' : 'rgba(16, 185, 95, 0.05)' }]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="analytics" size={20} color={colors.primary} />
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>Summary</Text>
              </View>
              
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Net P&L</Text>
                  <Text style={[styles.summaryValue, { color: calculations.netProfitLoss >= 0 ? colors.profit : colors.loss }]}>
                    {formatCurrency(calculations.netProfitLoss, true)}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Return</Text>
                  <Text style={[styles.summaryValue, { color: calculations.returnPercentage >= 0 ? colors.profit : colors.loss }]}>
                    {formatPercentage(calculations.returnPercentage, true)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Notes Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Notes</Text>
            <TextInput
              style={[styles.textArea, { color: themeColors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this month..."
              placeholderTextColor={themeColors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.spacer} />
        </ScrollView>
        
        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Saving...' : 'Save Month'}
            </Text>
            {!isSubmitting && <Ionicons name="checkmark" size={20} color={colors.white} />}
          </TouchableOpacity>
        </View>
        
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    opacity: 0.7,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: 2,
  },
  monthValue: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
  },
  currencySymbol: {
    fontFamily: fonts.medium,
    fontSize: 16,
    marginRight: 4,
  },
  input: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 95, 0.2)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  textArea: {
    fontFamily: fonts.regular,
    padding: 14,
    borderRadius: 12,
    minHeight: 80,
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 16,
  },
});
