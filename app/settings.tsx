import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../src/config/fonts';
import { useAuth } from '../src/context/AuthContext';
import { usePrivacy } from '../src/context/PrivacyContext';
import { useTheme } from '../src/context/ThemeContext';
import { useTrading } from '../src/context/TradingContext';
import {
    BiometricCapabilities,
    getBiometricCapabilities,
    getBiometricName,
    isBiometricEnabled,
    setBiometricEnabled,
} from '../src/services/biometricService';
import { generateAndShareCSV } from '../src/services/csvService';
import { exportTradesToCSV } from '../src/services/exportService';
import { sendSupportEmail } from '../src/services/feedbackService';
import {
    areNotificationsEnabled,
    cancelAllNotifications,
    loadReminderSettings,
    ReminderSettings,
    requestNotificationPermissions,
    saveReminderSettings,
    sendTestNotification,
} from '../src/services/notificationService';
import { fontScale, scale } from '../src/utils/scaling';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { user, logout } = useAuth();
  const { months, trades, yearlyGoal, setYearlyGoal } = useTrading();
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Sync localName when user displayName changes
  useEffect(() => {
    setLocalName(user?.displayName || '');
  }, [user?.displayName]);
  
  const [biometric, setBiometric] = useState<BiometricCapabilities | null>(null);
  const [biometricOn, setBiometricOn] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    day: 28,
    hour: 10,
    minute: 0,
    enabled: false,
  });
  
  // Yearly Goal state
  const [editingGoal, setEditingGoal] = useState(false);
  const [localGoal, setLocalGoal] = useState(yearlyGoal.toString());
  
  // Sync localGoal when yearlyGoal changes
  useEffect(() => {
    setLocalGoal(yearlyGoal > 0 ? yearlyGoal.toLocaleString() : '');
  }, [yearlyGoal]);
  
  useEffect(() => {
    const checkSettings = async () => {
      // Check biometric
      const caps = await getBiometricCapabilities();
      setBiometric(caps);
      const biometricEnabled = await isBiometricEnabled();
      setBiometricOn(biometricEnabled);
      
      // Check notifications
      const notifEnabled = await areNotificationsEnabled();
      setNotificationsOn(notifEnabled);
      
      // Load reminder settings
      const settings = await loadReminderSettings();
      setReminderSettings(settings);
    };
    checkSettings();
  }, []);
  
  const handleBiometricToggle = async (value: boolean) => {
    await setBiometricEnabled(value);
    setBiometricOn(value);
  };
  
  const openReminderModal = async () => {
    // Request permission first if not granted
    const granted = await areNotificationsEnabled();
    if (!granted) {
      const newGrant = await requestNotificationPermissions();
      if (!newGrant) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings to use reminders.');
        return;
      }
      setNotificationsOn(true);
    }
    // If reminders already enabled, show summary view first
    setIsEditMode(!reminderSettings.enabled);
    setShowReminderModal(true);
  };
  
  const handleSaveReminder = async (settings: ReminderSettings) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveReminderSettings(settings);
    setReminderSettings(settings);
    setNotificationsOn(settings.enabled);
    setShowReminderModal(false);
    
    if (settings.enabled) {
      Alert.alert('Reminder Set!', `You'll be reminded on the ${settings.day}${getDaySuffix(settings.day)} of each month at ${formatTime(settings.hour, settings.minute)}.`);
    }
  };
  
  const handleDisableReminder = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cancelAllNotifications();
    const newSettings = { ...reminderSettings, enabled: false };
    await saveReminderSettings(newSettings);
    setReminderSettings(newSettings);
    setNotificationsOn(false);
    setShowReminderModal(false);
  };
  
  const handleTestNotification = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await sendTestNotification();
    Alert.alert('Test Sent!', 'Check your notifications.');
  };
  
  // Helper functions
  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  const formatTime = (hour: number, minute: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };
  
  const handleExportCSV = async () => {
    if (months.length === 0) {
      Alert.alert('No Data', 'You have no months to export.');
      return;
    }
    try {
      await generateAndShareCSV(months);
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert('Error', err.message);
      } else {
        Alert.alert('Error', 'Failed to export data.');
      }
    }
  };
  
  const handleExportTrades = async () => {
    if (trades.length === 0) {
      Alert.alert('No Trades', 'You have no trades to export.');
      return;
    }
    try {
      await exportTradesToCSV(trades);
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert('Error', err.message);
      } else {
        Alert.alert('Error', 'Failed to export trades.');
      }
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(12) }}>
        <View style={{ width: scale(24), height: scale(24), justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={icon} size={scale(22)} color={iconColor} style={{ opacity: 0.85 }} />
        </View>
        <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: type === 'action' && iconColor === '#EF4444' ? '#EF4444' : themeColors.text }}>{label}</Text>
      </View>
      
      {type === 'toggle' && (
        <View style={{ height: scale(36), justifyContent: 'center' }}>
          <Switch
            value={value as boolean}
            onValueChange={(v) => onPress && onPress()}
            trackColor={{ false: isDark ? '#3F3F46' : '#D4D4D8', true: '#10B95F' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={isDark ? '#3F3F46' : '#D4D4D8'}
          />
        </View>
      )}
      
      {type === 'link' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
          {value && value !== 'Off' ? (
            <View style={{ backgroundColor: 'rgba(16, 185, 95, 0.15)', paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(8) }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(12), color: '#10B95F' }}>{value}</Text>
            </View>
          ) : value === 'Off' ? (
            <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(14), color: themeColors.textMuted }}>{value}</Text>
          ) : null}
          <Ionicons name="chevron-forward" size={scale(18)} color={themeColors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingTop: scale(16), paddingBottom: scale(20) }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: scale(40),
              height: scale(40),
              borderRadius: scale(12),
              backgroundColor: themeColors.card,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: themeColors.border,
              position: 'absolute',
              left: scale(20),
              zIndex: 1,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={scale(22)} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: fontScale(24), color: themeColors.text, textAlign: 'center' }}>Settings</Text>
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
              {editingName ? (
                <TextInput
                  style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: themeColors.text, padding: 0, borderBottomWidth: 1, borderBottomColor: '#10B95F' }}
                  value={localName}
                  onChangeText={setLocalName}
                  onBlur={async () => {
                    setEditingName(false);
                    if (localName.trim() !== (user?.displayName || '')) {
                      setIsSavingName(true);
                      try {
                        const { updateDisplayName } = await import('../src/services/authService');
                        await updateDisplayName(localName.trim());
                        await refreshUser();
                      } catch (e) {
                        console.error('Failed to update name:', e);
                      } finally {
                        setIsSavingName(false);
                      }
                    }
                  }}
                  onSubmitEditing={async () => {
                    setEditingName(false);
                    if (localName.trim() !== (user?.displayName || '')) {
                      setIsSavingName(true);
                      try {
                        const { updateDisplayName } = await import('../src/services/authService');
                        await updateDisplayName(localName.trim());
                        await refreshUser();
                      } catch (e) {
                        console.error('Failed to update name:', e);
                      } finally {
                        setIsSavingName(false);
                      }
                    }
                  }}
                  autoFocus
                  returnKeyType="done"
                  placeholder="Enter your name"
                  placeholderTextColor={themeColors.textMuted}
                />
              ) : (
                <TouchableOpacity onPress={() => setEditingName(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: themeColors.text }}>
                    {user?.displayName || user?.email?.split('@')[0] || 'TradeX User'}
                  </Text>
                  <Ionicons name="pencil" size={fontScale(14)} color={themeColors.textMuted} />
                </TouchableOpacity>
              )}
              <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: themeColors.textMuted, marginTop: scale(2) }}>
                {user?.email || 'Not signed in'}
              </Text>

            </View>
            </LinearGradient>
        </View>
        
        {/* Goals Section */}
        <View style={{ marginBottom: scale(24) }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: scale(24), marginBottom: scale(8) }}>Goals</Text>
          <View style={{ marginHorizontal: scale(20), backgroundColor: themeColors.card, borderRadius: scale(16), overflow: 'hidden', borderWidth: 1, borderColor: themeColors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: scale(16), paddingHorizontal: scale(16) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(12) }}>
                <View style={{ width: scale(24), height: scale(24), justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="flag" size={scale(22)} color="#6366F1" style={{ opacity: 0.85 }} />
                </View>
                <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(16), color: themeColors.text }}>Yearly Goal</Text>
              </View>
              
              {editingGoal ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(16), color: themeColors.text }}>$</Text>
                  <TextInput
                    style={{ 
                      fontFamily: fonts.semiBold, 
                      fontSize: fontScale(16), 
                      color: themeColors.text, 
                      borderBottomWidth: 1, 
                      borderBottomColor: '#6366F1',
                      minWidth: scale(80),
                      paddingVertical: scale(4),
                    }}
                    value={localGoal}
                    onChangeText={(text) => {
                      // Remove non-numeric characters except for the input
                      const numericValue = text.replace(/[^0-9]/g, '');
                      // Format with commas
                      const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      setLocalGoal(formattedValue);
                    }}
                    keyboardType="numeric"
                    placeholder="10,000"
                    placeholderTextColor={themeColors.textMuted}
                    autoFocus
                    onBlur={async () => {
                      setEditingGoal(false);
                      const goalValue = parseFloat(localGoal.replace(/,/g, '')) || 0;
                      if (goalValue !== yearlyGoal) {
                        await setYearlyGoal(goalValue);
                      }
                    }}
                    onSubmitEditing={async () => {
                      setEditingGoal(false);
                      const goalValue = parseFloat(localGoal.replace(/,/g, '')) || 0;
                      if (goalValue !== yearlyGoal) {
                        await setYearlyGoal(goalValue);
                      }
                    }}
                    returnKeyType="done"
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={() => setEditingGoal(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}
                >
                  {yearlyGoal > 0 ? (
                    <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(8) }}>
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: '#6366F1' }}>${yearlyGoal.toLocaleString()}</Text>
                    </View>
                  ) : (
                    <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(14), color: themeColors.textMuted }}>Set goal</Text>
                  )}
                  <Ionicons name="pencil" size={scale(16)} color={themeColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
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
              showBorder={true}
            />
            <SettingItem 
              icon="eye-off" 
              iconColor="#8B5CF6" 
              label="Privacy Mode" 
              type="toggle" 
              value={isPrivacyMode} 
              onPress={togglePrivacyMode} 
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

        {/* Notifications Section */}
        <View style={{ marginBottom: scale(24) }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: scale(24), marginBottom: scale(8) }}>Notifications</Text>
          <View style={{ marginHorizontal: scale(20), backgroundColor: themeColors.card, borderRadius: scale(16), overflow: 'hidden', borderWidth: 1, borderColor: themeColors.border, justifyContent: 'center' }}>
            <SettingItem 
              icon="notifications" 
              iconColor="#10B95F" 
              label="Monthly Reminders" 
              type="link" 
              value={reminderSettings.enabled ? 'On' : 'Off'}
              onPress={openReminderModal} 
              showBorder={false}
            />
          </View>
        </View>
        
        {/* Data Section */}
        <View style={{ marginBottom: scale(24) }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(13), color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: scale(24), marginBottom: scale(8) }}>Data Management</Text>
          <View style={{ marginHorizontal: scale(20), backgroundColor: themeColors.card, borderRadius: scale(16), overflow: 'hidden', borderWidth: 1, borderColor: themeColors.border }}>
            <SettingItem 
              icon="download" 
              iconColor="#3B82F6" 
              label="Export Months CSV" 
              type="link" 
              onPress={handleExportCSV} 
            />
            <SettingItem 
              icon="swap-horizontal" 
              iconColor="#FB923C" 
              label="Export Trades CSV" 
              type="link" 
              onPress={handleExportTrades} 
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
              onPress={async () => {
                try {
                  await sendSupportEmail(user?.email || undefined);
                } catch (error: any) {
                  Alert.alert('Error', error.message || 'Could not open email client.');
                }
              }}
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
      
      {/* Reminder Settings Modal */}
      <Modal
        visible={showReminderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: themeColors.card, borderTopLeftRadius: scale(24), borderTopRightRadius: scale(24), paddingBottom: scale(40) }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: scale(20), borderBottomWidth: 1, borderBottomColor: themeColors.border }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(20), color: themeColors.text }}>
                {isEditMode ? 'Set Reminder' : 'Monthly Reminders'}
              </Text>
              <TouchableOpacity onPress={() => setShowReminderModal(false)} style={{ width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: themeColors.border, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="close" size={scale(18)} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Summary View - when reminders are enabled and not in edit mode */}
            {reminderSettings.enabled && !isEditMode ? (
              <View style={{ padding: scale(20) }}>
                {/* Hero Section */}
                <View style={{ alignItems: 'center', marginBottom: scale(24) }}>
                  <LinearGradient
                    colors={['#10B95F', '#059669']}
                    style={{ width: scale(72), height: scale(72), borderRadius: scale(20), justifyContent: 'center', alignItems: 'center', marginBottom: scale(16), shadowColor: '#10B95F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}
                  >
                    <Ionicons name="notifications" size={scale(32)} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(18), color: themeColors.text, marginBottom: scale(4) }}>Reminder Active</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(13), color: themeColors.textMuted }}>You'll receive a monthly notification</Text>
                </View>
                
                {/* Schedule Card */}
                <View style={{ backgroundColor: themeColors.border, borderRadius: scale(16), marginBottom: scale(20), overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: scale(16), borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                    <View style={{ width: scale(36), height: scale(36), borderRadius: scale(10), backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }}>
                      <Ionicons name="calendar-outline" size={scale(18)} color={themeColors.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: themeColors.textMuted, marginBottom: scale(2) }}>Day</Text>
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: themeColors.text }}>{reminderSettings.day}{getDaySuffix(reminderSettings.day)} of each month</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: scale(16) }}>
                    <View style={{ width: scale(36), height: scale(36), borderRadius: scale(10), backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }}>
                      <Ionicons name="time-outline" size={scale(18)} color={themeColors.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(12), color: themeColors.textMuted, marginBottom: scale(2) }}>Time</Text>
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: themeColors.text }}>{formatTime(reminderSettings.hour, reminderSettings.minute)}</Text>
                    </View>
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: scale(10), marginBottom: scale(16) }}>
                  <TouchableOpacity
                    onPress={() => setIsEditMode(true)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(16, 185, 95, 0.15)' : 'rgba(16, 185, 95, 0.1)', borderRadius: scale(12), padding: scale(14), gap: scale(6) }}
                  >
                    <Ionicons name="create-outline" size={scale(18)} color="#10B95F" />
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: '#10B95F' }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleTestNotification}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: themeColors.border, borderRadius: scale(12), padding: scale(14), gap: scale(6) }}
                  >
                    <Ionicons name="paper-plane-outline" size={scale(18)} color={themeColors.text} />
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: themeColors.text }}>Test</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Disable Button */}
                <TouchableOpacity
                  onPress={handleDisableReminder}
                  style={{ alignItems: 'center', padding: scale(14), borderRadius: scale(12), backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)' }}
                >
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: '#EF4444' }}>Turn Off Reminders</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Edit Mode */
              <>
                {/* Day Picker */}
                <View style={{ padding: scale(20) }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: themeColors.text, marginBottom: scale(12) }}>Day of Month</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: scale(8) }}>
                      {[1, 5, 10, 15, 20, 25, 30].map((day) => (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setReminderSettings(prev => ({ ...prev, day }))}
                          style={{
                            width: scale(48),
                            height: scale(48),
                            borderRadius: scale(12),
                            backgroundColor: reminderSettings.day === day ? '#10B95F' : themeColors.border,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(16), color: reminderSettings.day === day ? '#FFFFFF' : themeColors.text }}>{day}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                
                {/* Time Picker */}
                <View style={{ paddingHorizontal: scale(20), paddingBottom: scale(20) }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(14), color: themeColors.text, marginBottom: scale(12) }}>Time</Text>
                  <View style={{ flexDirection: 'row', gap: scale(8) }}>
                    {[
                      { label: 'Morning', hour: 9 },
                      { label: 'Midday', hour: 12 },
                      { label: 'Evening', hour: 18 },
                      { label: 'Night', hour: 21 },
                    ].map(({ label, hour }) => (
                      <TouchableOpacity
                        key={hour}
                        onPress={() => setReminderSettings(prev => ({ ...prev, hour, minute: 0 }))}
                        style={{
                          flex: 1,
                          paddingVertical: scale(12),
                          borderRadius: scale(12),
                          backgroundColor: reminderSettings.hour === hour ? '#10B95F' : themeColors.border,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(12), color: reminderSettings.hour === hour ? '#FFFFFF' : themeColors.text }}>{label}</Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: fontScale(10), color: reminderSettings.hour === hour ? 'rgba(255,255,255,0.8)' : themeColors.textMuted }}>{formatTime(hour, 0)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Test Notification Button */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(16) }}>
                  <TouchableOpacity
                    onPress={handleTestNotification}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: themeColors.border, borderRadius: scale(14), padding: scale(16), gap: scale(8) }}
                  >
                    <Ionicons name="notifications-outline" size={scale(20)} color={themeColors.text} />
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: fontScale(15), color: themeColors.text }}>Send Test Notification</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Save Button */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(12) }}>
                  <TouchableOpacity
                    onPress={() => handleSaveReminder({ ...reminderSettings, enabled: true })}
                  >
                    <LinearGradient
                      colors={['#10B95F', '#059669']}
                      style={{ borderRadius: scale(14), padding: scale(16), alignItems: 'center' }}
                    >
                      <Text style={{ fontFamily: fonts.bold, fontSize: fontScale(16), color: '#FFFFFF' }}>Save & Enable</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                
                {/* Cancel/Back Button for edit mode when already enabled */}
                {reminderSettings.enabled && (
                  <View style={{ paddingHorizontal: scale(20) }}>
                    <TouchableOpacity
                      onPress={() => setIsEditMode(false)}
                      style={{ alignItems: 'center', padding: scale(12) }}
                    >
                      <Text style={{ fontFamily: fonts.medium, fontSize: fontScale(14), color: themeColors.textMuted }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
