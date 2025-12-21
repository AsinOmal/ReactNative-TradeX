import React from 'react';
import { View } from 'react-native';

/**
 * Wrapper component to ensure layout consistency
 */
export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
