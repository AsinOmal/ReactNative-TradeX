import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { fontScale, scale } from '../../src/utils/scaling';

export default function TabLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const themeColors = {
    bg: isDark ? 'rgba(24, 24, 27, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    border: isDark ? 'rgba(39, 39, 42, 0.8)' : 'rgba(228, 228, 231, 0.8)',
    active: '#10B95F',
    inactive: isDark ? '#71717A' : '#A1A1AA',
  };
  
  const bottomMargin = Math.max(insets.bottom, scale(20));
  
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: themeColors.active,
          tabBarInactiveTintColor: themeColors.inactive,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: themeColors.bg,
            borderRadius: scale(40),
            marginHorizontal: scale(24),
            marginBottom: bottomMargin,
            height: scale(60),
            position: 'absolute',
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 15,
          },
          tabBarLabelStyle: {
            fontWeight: '500',
            fontSize: fontScale(10),
            marginTop: -2,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={scale(22)} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trades"
          options={{
            title: 'Trades',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "swap-horizontal" : "swap-horizontal-outline"} size={scale(22)} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={scale(22)} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={scale(22)} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "time" : "time-outline"} size={scale(22)} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
