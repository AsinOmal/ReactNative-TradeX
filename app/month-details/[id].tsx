import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { fonts } from '../../src/config/fonts';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import { calculateMonthMetrics } from '../../src/services/calculationService';
import { formatMonthDisplay } from '../../src/utils/dateUtils';
import { formatCurrency, formatCurrencyInput, formatPercentage, parseCurrency } from '../../src/utils/formatters';
import { validateMonthForm } from '../../src/utils/validators';

export default function MonthDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMonthById, updateMonth, deleteMonth, generatePDF, getTradesByMonth } = useTrading();
  const { isDark } = useTheme();
  
  const month = getMonthById(id!);
  const monthTrades = month ? getTradesByMonth(month.month) : [];
  
  // Use trade P&L when trades exist
  const hasTrades = monthTrades.length > 0;
  const tradePnL = hasTrades ? monthTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0) : 0;
  const effectivePnL = hasTrades ? tradePnL : (month?.netProfitLoss ?? 0);
  const effectiveReturn = hasTrades && month && month.startingCapital > 0
    ? (tradePnL / month.startingCapital) * 100
    : (month?.returnPercentage ?? 0);
  
  const [isEditing, setIsEditing] = useState(false);
  const [startingCapital, setStartingCapital] = useState('');
  const [endingCapital, setEndingCapital] = useState('');
  const [deposits, setDeposits] = useState('');
  const [withdrawals, setWithdrawals] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  
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
      return calculateMonthMetrics(start, end, with_, dep);
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
    
    const validation = validateMonthForm(start, end, with_, dep, month.month);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const metrics = calculateMonthMetrics(start, end, with_, dep);
      await updateMonth(month.id, {
        startingCapital: start,
        endingCapital: end,
        deposits: with_,
        withdrawals: dep,
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
  
  const profitColor = effectivePnL >= 0 ? colors.profit : colors.loss;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 20, 
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontFamily: fonts.semiBold, color: colors.text }}>
            {formatMonthDisplay(month.month)}
          </Text>
          <TouchableOpacity 
            onPress={() => setIsEditing(!isEditing)} 
            style={{ 
              padding: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons 
              name={isEditing ? "close-circle" : "pencil"} 
              size={24} 
              color={isEditing ? colors.loss : colors.primary} 
            />
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
              {/* Hero P&L Card */}
              <LinearGradient
                colors={effectivePnL >= 0 ? ['#10B95F', '#059669'] : ['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 24,
                  padding: 24,
                  marginBottom: 24,
                  shadowColor: effectivePnL >= 0 ? '#10B95F' : '#EF4444',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                    Net Profit/Loss
                  </Text>
                  {hasTrades && (
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: 11, color: '#FFFFFF' }}>FROM TRADES</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 36, color: '#FFFFFF', marginBottom: 8 }}>
                  {formatCurrency(effectivePnL, true)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF' }}>
                      {formatPercentage(effectiveReturn, true)}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    return on capital
                  </Text>
                </View>
              </LinearGradient>

              {/* Capital & Flow Summary */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99, 102, 241, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="wallet-outline" size={18} color="#6366F1" />
                  </View>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: colors.text }}>Capital</Text>
                </View>
                
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Starting</Text>
                  <Text style={[styles.cardValue, { color: colors.text }]}>{formatCurrency(month.startingCapital)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Ending</Text>
                  <Text style={[styles.cardValue, { color: colors.text }]}>{formatCurrency(month.endingCapital)}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Gross Change</Text>
                  <Text style={[styles.cardValue, { color: month.grossChange >= 0 ? colors.profit : colors.loss }]}>
                    {formatCurrency(month.grossChange, true)}
                  </Text>
                </View>
              </View>

              {/* Trades Breakdown */}
              {monthTrades.length > 0 && (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(251, 146, 60, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="swap-horizontal" size={18} color="#FB923C" />
                      </View>
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: colors.text }}>Trades ({monthTrades.length})</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/trades')}>
                      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#FB923C' }}>View All</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {monthTrades.slice(0, 5).map((trade, index) => (
                    <TouchableOpacity 
                      key={trade.id}
                      onPress={() => router.push({ pathname: '/trade-detail', params: { id: trade.id } })}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: (trade.pnl ?? 0) >= 0 ? 'rgba(16, 185, 95, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Ionicons 
                            name={(trade.pnl ?? 0) >= 0 ? 'trending-up' : 'trending-down'} 
                            size={16} 
                            color={(trade.pnl ?? 0) >= 0 ? colors.profit : colors.loss} 
                          />
                        </View>
                        <View>
                          <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: colors.text }}>{trade.symbol}</Text>
                          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted }}>
                            {trade.exitDate ? new Date(trade.exitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Open'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: (trade.pnl ?? 0) >= 0 ? colors.profit : colors.loss }}>
                          {(trade.pnl ?? 0) >= 0 ? '+' : ''}${Math.abs(trade.pnl ?? 0).toFixed(2)}
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted }}>
                          {(trade.returnPercentage ?? 0) >= 0 ? '+' : ''}{(trade.returnPercentage ?? 0).toFixed(1)}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {monthTrades.length > 5 && (
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingTop: 12 }}>
                      +{monthTrades.length - 5} more trades
                    </Text>
                  )}
                </View>
              )}

              {/* Cash Flow Card */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(16, 185, 95, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="swap-vertical-outline" size={18} color="#10B95F" />
                  </View>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: colors.text }}>Cash Flow</Text>
                </View>
                
                <View style={styles.cardRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="arrow-down-circle" size={18} color={colors.profit} />
                    <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Deposits</Text>
                  </View>
                  <Text style={[styles.cardValue, { color: colors.profit }]}>+{formatCurrency(month.deposits)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="arrow-up-circle" size={18} color={colors.loss} />
                    <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Withdrawals</Text>
                  </View>
                  <Text style={[styles.cardValue, { color: colors.loss }]}>-{formatCurrency(month.withdrawals)}</Text>
                </View>
              </View>

              {/* Notes */}
              {month.notes && (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(251, 191, 36, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="document-text-outline" size={18} color="#FBBF24" />
                    </View>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: colors.text }}>Notes</Text>
                  </View>
                  <Text style={[styles.notesText, { color: colors.text }]}>{month.notes}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.pdfButton}
                  onPress={handleGeneratePDF}
                >
                  <Ionicons name="document-text-outline" size={18} color="#6366F1" />
                  <Text style={styles.pdfButtonText}>Export PDF</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
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
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  marginTop: {
    marginTop: 16,
  },
  link: {
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    fontFamily: fonts.medium,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  editButton: {
    padding: 8,
  },
  editText: {
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
    borderWidth: 1,
  },
  inputPrefix: {
    fontSize: 20,
    fontFamily: fonts.medium,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.medium,
    padding: 0,
  },
  textArea: {
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    fontSize: 15,
    fontFamily: fonts.medium,
    borderWidth: 1,
  },
  preview: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  previewValue: {
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  saveButton: {
    backgroundColor: '#10B95F',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B95F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
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
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  cardValue: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  resultValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  notesText: {
    fontSize: 15,
    fontFamily: fonts.regular,
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
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  pdfButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  spacer: {
    height: 40,
  },
});
