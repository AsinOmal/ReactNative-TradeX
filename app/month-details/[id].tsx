import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { calculateMonthMetrics } from '../../src/services/calculationService';
import { formatMonthDisplay } from '../../src/utils/dateUtils';
import { formatCurrency, formatCurrencyInput, formatPercentage, parseCurrency } from '../../src/utils/formatters';
import { validateMonthForm } from '../../src/utils/validators';

export default function MonthDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMonthById, updateMonth, deleteMonth, generatePDF } = useTrading();
  const { isDark } = useTheme();
  
  const month = getMonthById(id!);
  
  const [isEditing, setIsEditing] = useState(false);
  const [startingCapital, setStartingCapital] = useState('');
  const [endingCapital, setEndingCapital] = useState('');
  const [deposits, setDeposits] = useState('');
  const [withdrawals, setWithdrawals] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const colors = {
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    card: isDark ? '#1F1F23' : '#F4F4F5',
    border: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    primary: '#6366F1',
    profit: '#10B981',
    loss: '#EF4444',
  };
  
  useEffect(() => {
    if (month) {
      setStartingCapital(month.startingCapital.toString());
      setEndingCapital(month.endingCapital.toString());
      setDeposits(month.deposits.toString());
      setWithdrawals(month.withdrawals.toString());
      setNotes(month.notes);
    }
  }, [month]);
  
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
  
  if (!month) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Month not found
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.marginTop}>
            <Text style={[styles.link, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
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
    
    // Validate fields
    const startValid = validateField('startingCapital', startingCapital);
    const endValid = validateField('endingCapital', endingCapital);
    const depValid = validateField('deposits', deposits);
    const withValid = validateField('withdrawals', withdrawals);

    if (!startValid || !endValid || !depValid || !withValid) {
      Alert.alert('Validation Error', 'Please correct the errors in the form.');
      return;
    }
    
    const validation = validateMonthForm(start, end, dep, with_, month.month);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const metrics = calculateMonthMetrics(start, end, dep, with_);
      await updateMonth(month.id, {
        startingCapital: start,
        endingCapital: end,
        deposits: dep,
        withdrawals: with_,
        notes,
        ...metrics,
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update month');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Month',
      `Are you sure you want to delete ${formatMonthDisplay(month.month)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteMonth(month.id);
            router.back();
          }
        },
      ]
    );
  };
  
  const handleGeneratePDF = async () => {
    try {
      await generatePDF(month.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };
  
  const profitColor = month.netProfitLoss >= 0 ? colors.profit : colors.loss;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {formatMonthDisplay(month.month)}
          </Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
            <Text style={[styles.editText, { color: colors.primary }]}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isEditing ? (
            // Edit Mode
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Starting Capital</Text>
                <View style={[styles.inputContainer, { 
                    backgroundColor: colors.card, 
                    borderColor: errors.startingCapital ? colors.loss : colors.border,
                    borderWidth: errors.startingCapital ? 1 : 1
                }]}>
                  <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>$</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={startingCapital}
                    onChangeText={(text) => {
                        setStartingCapital(formatCurrencyInput(text));
                        if (errors.startingCapital) validateField('startingCapital', text);
                    }}
                    onBlur={() => validateField('startingCapital', startingCapital)}
                    keyboardType="decimal-pad"
                  />
                </View>
                {errors.startingCapital && (
                  <Text style={{ color: colors.loss, fontSize: 12, marginTop: 4 }}>{errors.startingCapital}</Text>
                )}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Ending Capital</Text>
                <View style={[styles.inputContainer, { 
                    backgroundColor: colors.card, 
                    borderColor: errors.endingCapital ? colors.loss : colors.border,
                    borderWidth: errors.endingCapital ? 1 : 1
                }]}>
                  <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>$</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={endingCapital}
                    onChangeText={(text) => {
                        setEndingCapital(formatCurrencyInput(text));
                        if (errors.endingCapital) validateField('endingCapital', text);
                    }}
                    onBlur={() => validateField('endingCapital', endingCapital)}
                    keyboardType="decimal-pad"
                  />
                </View>
                {errors.endingCapital && (
                  <Text style={{ color: colors.loss, fontSize: 12, marginTop: 4 }}>{errors.endingCapital}</Text>
                )}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Deposits</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>$</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={deposits}
                    onChangeText={(text) => setDeposits(formatCurrencyInput(text))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Withdrawals</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>$</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={withdrawals}
                    onChangeText={(text) => setWithdrawals(formatCurrencyInput(text))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Notes</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              {calculations && (
                <View style={[styles.preview, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.5)' : '#F4F4F5' }]}>
                  <Text style={[styles.previewTitle, { color: colors.textMuted }]}>Preview</Text>
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Net P&L</Text>
                    <Text style={[styles.previewValue, { color: calculations.netProfitLoss >= 0 ? colors.profit : colors.loss }]}>
                      {formatCurrency(calculations.netProfitLoss, true)}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Return</Text>
                    <Text style={[styles.previewValue, { color: calculations.returnPercentage >= 0 ? colors.profit : colors.loss }]}>
                      {formatPercentage(calculations.returnPercentage, true)}
                    </Text>
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // View Mode
            <>
              {/* Capital Summary */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Capital Summary</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Starting</Text>
                    <Text style={[styles.cardValue, { color: colors.text }]}>
                      {formatCurrency(month.startingCapital)}
                    </Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Ending</Text>
                    <Text style={[styles.cardValue, { color: colors.text }]}>
                      {formatCurrency(month.endingCapital)}
                    </Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Change</Text>
                    <Text style={[styles.cardValue, { color: month.grossChange >= 0 ? colors.profit : colors.loss }]}>
                      {formatCurrency(month.grossChange, true)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Cash Flow */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Cash Flow</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Deposits</Text>
                    <Text style={[styles.cardValue, { color: colors.profit }]}>
                      +{formatCurrency(month.deposits)}
                    </Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Withdrawals</Text>
                    <Text style={[styles.cardValue, { color: colors.loss }]}>
                      -{formatCurrency(month.withdrawals)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Trading Results */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Trading Results</Text>
                <View style={[styles.resultsCard, { backgroundColor: isDark ? 'rgba(39, 39, 42, 0.5)' : '#F4F4F5' }]}>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Net P&L</Text>
                    <Text style={[styles.resultValue, { color: profitColor }]}>
                      {formatCurrency(month.netProfitLoss, true)}
                    </Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Return</Text>
                    <Text style={[styles.resultValue, { color: profitColor }]}>
                      {formatPercentage(month.returnPercentage, true)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Notes */}
              {month.notes && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Notes</Text>
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.notesText, { color: colors.text }]}>
                      {month.notes}
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Action Buttons - PDF outlined, Delete filled */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.pdfButton}
                  onPress={handleGeneratePDF}
                >
                  <Ionicons name="document-text-outline" size={18} color="#6366F1" />
                  <Text style={styles.pdfButtonText}>Generate PDF</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash" size={18} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          
          <View style={styles.spacer} />
        </ScrollView>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
  link: {
    fontSize: 16,
  },
  marginTop: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  editText: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  resultsCard: {
    borderRadius: 16,
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  cardLabel: {
    fontSize: 14,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  pdfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  pdfButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
  preview: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  previewLabel: {
    fontSize: 14,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});
