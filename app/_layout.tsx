import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import "../global.css";
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { TradingProvider } from '../src/context/TradingContext';

function RootLayoutContent() {
  const { isDark } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="add-month" 
          options={{ 
            presentation: 'modal',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="month-details/[id]" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TradingProvider>
        <RootLayoutContent />
      </TradingProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
