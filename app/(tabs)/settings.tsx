import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../src/config/fonts';
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
import { fontScale, scale } from '../../src/utils/scaling';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { months } = useTrading();
  const router = useRouter();
  
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
    bg: isDark ? '#0A0A0A' : '#FAFAFA',
    card: isDark ? '#1F1F23' : '#FFFFFF',
    border: isDark ? '#27272A' : '#E4E4E7',
    text: isDark ? '#F4F4F5' : '#18181B',
    textMuted: isDark ? '#71717A' : '#A1A1AA',
    iconBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };
  
  const SettingItem = ({ 
    icon, 
    iconColor, 
    label, 
    value, 
    onPress, 
    type = 'link', 
    showBorder = true 
  }: { 
    icon: any; 
    iconColor: string; 
    label: string; 
    value?: string | boolean; 
    onPress?: () => void; 
    type?: 'link' | 'toggle' | 'action'; 
    showBorder?: boolean 
  }) => (
    <TouchableOpacity 
      onPress={type === 'toggle' ? undefined : onPress}
      activeOpacity={type === 'toggle' ? 1 : 0.7}
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: scale(16),
        paddingHorizontal: scale(16),
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: themeColors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(14) }}>
        <View style={{ width: scale(36), height: scale(36), borderRadius: scale(10), backgroundColor: type === 'action' && iconColor === '#EF4444' ? 'rgba(239, 68, 68, 0.1)' : themeColors.iconBg, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={icon} size={scale(18)} color={iconColor} />
        </View>
        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: type === 'action' && iconColor === '#EF4444' ? '#EF4444' : themeColors.text }}>{label}</Text>
      </View>
      
      {type === 'toggle' && (
        <Switch
          value={value as boolean}
          onValueChange={(v) => onPress && onPress()}
          trackColor={{ false: themeColors.border, true: '#10B95F' }}
          thumbColor="#FFFFFF"
        />
      )}
      
      {type === 'link' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
          {value && <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(14), color: themeColors.textMuted }}>{value}</Text>}
          <Ionicons name="chevron-forward" size={scale(18)} color={themeColors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: themeColors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: scale(20), paddingTop: scale(16), paddingBottom: scale(20) }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(32), color: themeColors.text }}>Settings</Text>
        </View>
        
        {/* Profile Card */}
        <View style={{ marginHorizontal: scale(20), marginBottom: scale(24) }}>
            <LinearGradient
              colors={isDark ? ['#1F1F23', '#27272A'] : ['#FFFFFF', '#F4F4F5']}
              style={{ borderRadius: scale(20), padding: scale(20), flexDirection: 'row', alignItems: 'center', gap: scale(16), borderWidth: 1, borderColor: themeColors.border }}
            >
            <View style={{ width: scale(64), height: scale(64), borderRadius: scale(32), backgroundColor: '#10B95F', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B95F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(28), color: '#FFFFFF' }}>
                {user?.email?.[0].toUpperCase() || 'T'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: themeColors.text }}>
                {user?.email?.split('@')[0] || 'TradeX User'}
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: themeColors.textMuted, marginTop: scale(2) }}>
                {user?.email || 'Not signed in'}
              </Text>

            </View>
            </LinearGradient>
        </View>
        
        {/* Appearance Section */}
        <View style={{ marginBottom: scale(24) }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: scale(24), marginBottom: scale(8) }}>Preferences</Text>
          <View style={{ marginHorizontal: scale(20), backgroundColor: themeColors.card, borderRadius: scale(16), overflow: 'hidden', borderWidth: 1, borderColor: themeColors.border }}>
            <SettingItem 
              icon={isDark ? 'moon' : 'sunny'} 
              iconColor="#F59E0B" 
              label="Dark Mode" 
              type="toggle" 
              value={isDark} 
              onPress={toggleTheme} 
            />
            <SettingItem 
              icon="notifications" 
              iconColor="#6366F1" 
              label="Notifications" 
              type="link" 
              value="On" 
              showBorder={false}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={{ marginBottom: scale(24) }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: scale(24), marginBottom: scale(8) }}>Security</Text>
          <View style={{ marginHorizontal: scale(20), backgroundColor: themeColors.card, borderRadius: scale(16), overflow: 'hidden', borderWidth: 1, borderColor: themeColors.border }}>
            {biometric?.isAvailable && biometric.isEnrolled ? (
              <SettingItem 
                icon={biometric.biometricType === 'faceid' ? 'scan' : 'finger-print'} 
                iconColor="#10B95F" 
                label={getBiometricName(biometric.biometricType)} 
                type="toggle" 
                value={biometricOn} 
                onPress={() => handleBiometricToggle(!biometricOn)} 
                showBorder={false}
              />
            ) : (
              <SettingItem 
                icon="lock-closed" 
                iconColor={themeColors.textMuted} 
                label="Biometrics Unavailable" 
                type="link" 
                showBorder={false}
              />
            )}
          </View>
        </View>
        
        {/* Data Section */}
        <View style={{ marginBottom: scale(24) }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: scale(24), marginBottom: scale(8) }}>Data Management</Text>
          <View style={{ marginHorizontal: scale(20), backgroundColor: themeColors.card, borderRadius: scale(16), overflow: 'hidden', borderWidth: 1, borderColor: themeColors.border }}>
            <SettingItem 
              icon="download" 
              iconColor="#3B82F6" 
              label="Export CSV" 
              type="link" 
              onPress={handleExportCSV} 
              showBorder={false}
            />
          </View>
        </View>
        
        {/* Account Actions */}
        <View style={{ marginBottom: scale(32) }}>
          <View style={{ marginHorizontal: scale(20), backgroundColor: themeColors.card, borderRadius: scale(16), overflow: 'hidden', borderWidth: 1, borderColor: themeColors.border }}>
            <SettingItem 
              icon="help-circle" 
              iconColor={themeColors.text} 
              label="Help & Support" 
              type="link" 
            />
            <SettingItem 
              icon="log-out" 
              iconColor="#EF4444" 
              label="Sign Out" 
              type="action" 
              onPress={handleLogout} 
              showBorder={false}
            />
          </View>
        </View>
        
        {/* Version */}
        <View style={{ alignItems: 'center', marginBottom: scale(40) }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(16), color: themeColors.textMuted }}>TradeX</Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(12), color: themeColors.textMuted, opacity: 0.7, marginTop: scale(4) }}>Version 1.0.0 (Build 124)</Text>
        </View>
        
        {/* Bottom padding */}
        <View style={{ height: scale(80) }} />
      </ScrollView>
    </SafeAreaView>
  );
}
