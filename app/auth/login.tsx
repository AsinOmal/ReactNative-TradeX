import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { fontScale, scale } from '../../src/utils/scaling';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Debug: Log when error state changes
  React.useEffect(() => {
    console.log('Login screen error state:', error);
  }, [error]);
  
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      console.log('Login: Empty email or password');
      return;
    }
    console.log('Login: Attempting login for', email.trim());
    try {
      clearError();
      await login(email.trim(), password);
      console.log('Login: Success, should navigate to tabs');
    } catch (err: any) {
      console.log('Login: Failed with error', err?.code || err?.message);
      // Error is handled by AuthContext, stay on this screen
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      clearError();
      await loginWithGoogle();
    } catch (err) {}
  };
  
  const handleForgotPassword = () => {
    Alert.prompt(
      'Reset Password',
      'Enter your email address to receive a password reset link.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (inputEmail) => {
            if (!inputEmail?.trim()) {
              Alert.alert('Error', 'Please enter your email address.');
              return;
            }
            try {
              const { resetPassword } = await import('../../src/services/authService');
              await resetPassword(inputEmail.trim());
              Alert.alert('Success', 'Password reset email sent! Check your inbox.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to send reset email.');
            }
          },
        },
      ],
      'plain-text',
      email,
    );
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: scale(24), paddingBottom: scale(40) }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={{ 
              width: scale(44), 
              height: scale(44), 
              borderRadius: scale(12),
              backgroundColor: '#F4F4F5',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: scale(8),
              marginBottom: scale(16),
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={scale(24)} color="#18181B" />
          </TouchableOpacity>
          
          {/* Header - Centered */}
          <View style={{ alignItems: 'center', marginBottom: scale(24) }}>
            <Text style={{ fontSize: fontScale(48), fontWeight: '800', color: '#10B95F', textAlign: 'center', marginBottom: scale(8) }}>Login</Text>
            <Text style={{ fontSize: fontScale(15), color: '#71717A', lineHeight: fontScale(22), textAlign: 'center' }}>
              Happy to see you again.{'\n'}Let's track profits.
            </Text>
          </View>
          
          {/* Social Login */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: scale(24) }}>
            <TouchableOpacity 
              style={{ 
                width: scale(52), 
                height: scale(52), 
                borderRadius: scale(14),
                backgroundColor: '#F4F4F5',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={scale(22)} color="#18181B" />
            </TouchableOpacity>
          </View>
          
          {/* Error Message */}
          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: scale(12), borderRadius: scale(12), backgroundColor: 'rgba(239, 68, 68, 0.1)', marginBottom: scale(16), gap: scale(8) }}>
              <Ionicons name="alert-circle" size={scale(18)} color="#EF4444" />
              <Text style={{ fontSize: fontScale(14), color: '#EF4444', flex: 1 }}>{error}</Text>
            </View>
          )}
          
          {/* Form */}
          <View style={{ gap: scale(20), marginBottom: scale(24) }}>
            <View style={{ gap: scale(8) }}>
              <Text style={{ fontSize: fontScale(12), fontWeight: '600', color: '#71717A', letterSpacing: 1 }}>EMAIL</Text>
              <View 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: '#F4F4F5', 
                  borderRadius: scale(12),
                  paddingHorizontal: scale(16),
                  height: scale(56),
                }}
              >
                <Ionicons name="mail-outline" size={scale(20)} color="#71717A" style={{ marginRight: scale(12) }} />
                <TextInput
                  style={{ 
                    flex: 1, 
                    fontSize: fontScale(16), 
                    color: '#18181B',
                    height: '100%',
                  }}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="#A1A1AA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            
            <View style={{ gap: scale(8) }}>
              <Text style={{ fontSize: fontScale(12), fontWeight: '600', color: '#71717A', letterSpacing: 1 }}>PASSWORD</Text>
              <View 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: '#F4F4F5', 
                  borderRadius: scale(12),
                  paddingHorizontal: scale(16),
                  height: scale(56),
                }}
              >
                <Ionicons name="lock-closed-outline" size={scale(20)} color="#71717A" style={{ marginRight: scale(12) }} />
                <TextInput
                  style={{ 
                    flex: 1, 
                    fontSize: fontScale(16), 
                    color: '#18181B',
                    height: '100%',
                  }}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#A1A1AA"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: scale(12) }}>
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={scale(20)} 
                    color="#71717A" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Login Button - Filled */}
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#10B95F',
              paddingVertical: scale(18),
              borderRadius: scale(16),
              alignItems: 'center',
              marginBottom: scale(24),
              opacity: isLoading ? 0.6 : 1,
            }}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: fontScale(18), fontWeight: '700', color: '#FFFFFF' }}>Login</Text>
            )}
          </TouchableOpacity>
          
          {/* Forgot Password & Register */}
          <View style={{ alignItems: 'center', gap: scale(16) }}>
            <TouchableOpacity style={{ paddingVertical: scale(8) }} onPress={handleForgotPassword}>
              <Text style={{ fontSize: fontScale(14), fontWeight: '500', color: '#10B95F' }}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <Link href="/auth/register" asChild>
              <TouchableOpacity style={{ flexDirection: 'row', paddingVertical: scale(8) }}>
                <Text style={{ fontSize: fontScale(14), color: '#71717A' }}>Don't have an account? </Text>
                <Text style={{ fontSize: fontScale(14), fontWeight: '700', color: '#10B95F' }}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
