import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../src/config/fonts';
import { colors } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useTrading } from '../../src/context/TradingContext';
import {
  BiometricCapabilities,
  getBiometricCapabilities,
  getBiometricName,
  isBiometricEnabled,
  setBiometricEnabled,
} from '../../src/services/biometricService';
import { generateAndShareCSV } from '../../src/services/csvService';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { months } = useTrading();
  
  const [biometric, setBiometric] = useState<BiometricCapabilities | null>(null);
  const [biometricOn, setBiometricOn] = useState(false);
  
  useEffect(() => {
    const checkBiometric = async () => {
      const caps = await getBiometricCapabilities();
      setBiometric(caps);
      const enabled = await isBiometricEnabled();
      setBiometricOn(enabled);
    };
    checkBiometric();
  }, []);
  
  const handleBiometricToggle = async (value: boolean) => {
    await setBiometricEnabled(value);
    setBiometricOn(value);
  };
  
  const handleExportCSV = async () => {
    if (months.length === 0) {
      Alert.alert('No Data', 'You have no months to export.');
      return;
    }
    try {
      await generateAndShareCSV(months);
    } catch (err) {
      Alert.alert('Error', 'Failed to export data.');
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };
  
  const themeColors = {
    bg: isDark ? colors.darkBg : colors.lightBg,
    card: isDark ? colors.darkCard : colors.lightCard,
    border: isDark ? colors.darkBorder : colors.lightBorder,
    text: isDark ? colors.textLight : colors.textDark,
    textMuted: isDark ? colors.textMuted : colors.textMutedLight,
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>Settings</Text>
          <Text style={[styles.versionText, { color: themeColors.textMuted }]}>v1.0.0</Text>
        </View>
        
        {/* Profile Section */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.email?.[0].toUpperCase() || 'T'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: themeColors.text }]}>
                {user?.email?.split('@')[0] || 'TradeX User'}
              </Text>
              <Text style={[styles.profileEmail, { color: themeColors.textMuted }]}>
                {user?.email || 'Not signed in'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: themeColors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>
        
        {/* Security */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>Security</Text>
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          {biometric?.isAvailable && biometric.isEnrolled ? (
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons 
                  name={biometric.biometricType === 'faceid' ? 'scan' : 'finger-print'} 
                  size={22} 
                  color={colors.primary} 
                />
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                  {getBiometricName(biometric.biometricType)}
                </Text>
              </View>
              <Switch
                value={biometricOn}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: themeColors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ) : (
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="lock-closed" size={22} color={themeColors.textMuted} />
                <Text style={[styles.settingLabel, { color: themeColors.textMuted }]}>
                  Biometrics not available
                </Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Data */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>Data</Text>
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleExportCSV}>
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={22} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Export to CSV</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>
        
        {/* Account */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={22} color={colors.loss} />
              <Text style={[styles.settingLabel, { color: colors.loss }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
  },
  versionText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    opacity: 0.5,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  section: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
  profileEmail: {
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  appName: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  appVersion: {
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: 4,
  },
});
