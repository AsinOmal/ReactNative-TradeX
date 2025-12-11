import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { generateMonthOptions } from '../utils/dateUtils';

interface MonthPickerProps {
  visible: boolean;
  selectedMonth: string;
  onSelect: (month: string) => void;
  onClose: () => void;
  disabledMonths?: string[];
}

export function MonthPicker({ 
  visible, 
  selectedMonth, 
  onSelect, 
  onClose,
  disabledMonths = [] 
}: MonthPickerProps) {
  const { isDark } = useTheme();
  const options = generateMonthOptions();
  
  const colors = {
    surface: isDark ? '#18181B' : '#FFFFFF',
    border: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    primary: '#6366F1',
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Select Month
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const isSelected = option.key === selectedMonth;
              const isDisabled = disabledMonths.includes(option.key);
              
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                    isDisabled && styles.optionDisabled,
                  ]}
                  onPress={() => {
                    if (!isDisabled) {
                      onSelect(option.key);
                      onClose();
                    }
                  }}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.optionText,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                    isSelected && styles.optionTextSelected,
                    isDisabled && { color: colors.textMuted },
                  ]}>
                    {option.label}
                  </Text>
                  {isDisabled && (
                    <Text style={[styles.disabledLabel, { color: colors.textMuted }]}>
                      Already exists
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
  },
  scrollView: {
    padding: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#6366F1',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  disabledLabel: {
    fontSize: 12,
  },
});
