import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const BIOMETRIC_KEY = '@tradex_biometric_enabled';

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometricType: 'fingerprint' | 'faceid' | 'iris' | 'none';
  isEnrolled: boolean;
}

/**
 * Check if biometric authentication is available
 */
export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  const isAvailable = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const authTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
  
  let biometricType: BiometricCapabilities['biometricType'] = 'none';
  
  if (authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    biometricType = 'faceid';
  } else if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    biometricType = 'fingerprint';
  } else if (authTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    biometricType = 'iris';
  }
  
  return {
    isAvailable,
    biometricType,
    isEnrolled,
  };
}

/**
 * Get friendly name for biometric type
 */
export function getBiometricName(type: BiometricCapabilities['biometricType']): string {
  switch (type) {
    case 'faceid':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris Scan';
    default:
      return 'Biometric';
  }
}

/**
 * Authenticate with biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage = 'Authenticate to access TradeX'
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    
    return {
      success: result.success,
      error: result.error,
    };
  } catch (err) {
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Check if biometric lock is enabled
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const enabled = await AsyncStorage.getItem(BIOMETRIC_KEY);
  return enabled === 'true';
}

/**
 * Enable or disable biometric lock
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
}
