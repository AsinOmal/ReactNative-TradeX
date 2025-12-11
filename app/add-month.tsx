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
import { useTheme } from '../src/context/ThemeContext';
import { useTrading } from '../src/context/TradingContext';
import { calculateMonthMetrics, createMonthRecord } from '../src/services/calculationService';
import { monthExists } from '../src/services/storageService';
import { formatMonthDisplay, getMonthKey } from '../src/utils/dateUtils';
import { formatCurrency, formatCurrencyInput, formatPercentage, parseCurrency } from '../src/utils/formatters';
import { validateMonthForm } from '../src/utils/validators';

export default function AddMonthScreen() {
  const router = useRouter();
  const { months, addMonth } = useTrading();
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
  
  const colors = {
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    card: isDark ? '#1F1F23' : '#F4F4F5',
    surface: isDark ? '#18181B' : '#FFFFFF',
    border: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    primary: '#6366F1',
    profit: '#10B981',
    loss: '#EF4444',
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
  
  const handleSave = async () => {
    const start = parseCurrency(startingCapital);
    const end = parseCurrency(endingCapital);
    const dep = parseCurrency(deposits);
    const with_ = parseCurrency(withdrawals);
    
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Add Month
          </Text>
          <View style={styles.headerButton} />
        </View>
        
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Month Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Month</Text>
            <TouchableOpacity 
              style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={[styles.selectorText, { color: colors.text }]}>
                {formatMonthDisplay(selectedMonth)}
              </Text>
              <Text style={[styles.selectorArrow, { color: colors.textMuted }]}>▼</Text>
            </TouchableOpacity>
          </View>
          
          {/* Starting Capital */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Starting Capital</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={startingCapital}
                onChangeText={(text) => setStartingCapital(formatCurrencyInput(text))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          {/* Ending Capital */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Ending Capital</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={endingCapital}
                onChangeText={(text) => setEndingCapital(formatCurrencyInput(text))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          {/* Deposits */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Deposits (Optional)</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={deposits}
                onChangeText={(text) => setDeposits(formatCurrencyInput(text))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          {/* Withdrawals */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Withdrawals (Optional)</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={withdrawals}
                onChangeText={(text) => setWithdrawals(formatCurrencyInput(text))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          {/* Live Summary */}
          {calculations && (
            <View style={[styles.summary, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.5)' : '#F4F4F5' }]}>
              <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Gross Change</Text>
                <Text style={[styles.summaryValue, { color: calculations.grossChange >= 0 ? colors.profit : colors.loss }]}>
                  {formatCurrency(calculations.grossChange, true)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Net P&L</Text>
                <Text style={[styles.summaryValue, { color: calculations.netProfitLoss >= 0 ? colors.profit : colors.loss }]}>
                  {formatCurrency(calculations.netProfitLoss, true)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Return</Text>
                <Text style={[styles.summaryValue, { color: calculations.returnPercentage >= 0 ? colors.profit : colors.loss }]}>
                  {formatPercentage(calculations.returnPercentage, true)}
                </Text>
              </View>
            </View>
          )}
          
          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this month..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.spacer} />
        </ScrollView>
        
        {/* Save Button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Saving...' : 'Save Month'}

            </Text>
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
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 70,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 16,
  },
  selectorArrow: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputPrefix: {
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
  },
  textArea: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 100,
    fontSize: 16,
  },
  summary: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  spacer: {
    height: 100,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
