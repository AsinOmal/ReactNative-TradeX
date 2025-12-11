import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen 
        name="welcome" 
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="login" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
