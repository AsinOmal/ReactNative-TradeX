import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const colors = {
    bg: isDark ? 'rgba(24, 24, 27, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    border: isDark ? 'rgba(39, 39, 42, 0.8)' : 'rgba(228, 228, 231, 0.8)',
    active: '#6366F1',
    inactive: isDark ? '#71717A' : '#A1A1AA',
    iconBg: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
  };
  
  // Calculate bottom position - on mobile need to account for safe area
  // On web we use a fixed margin
  const bottomPosition = Platform.select({
    ios: insets.bottom > 0 ? insets.bottom : 20,
    android: 20,
    web: 20,
    default: 20,
  });
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderRadius: 50,
          overflow: "hidden",
          marginHorizontal: 40,
          marginBottom: 20,
          height: 58,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          position: "absolute",
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: colors.iconBg }]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: colors.iconBg }]}>
              <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: colors.iconBg }]}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    padding: 0,
    borderRadius: 10,
  },
});
