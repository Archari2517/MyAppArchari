import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

// This app uses a single screen (src/app/index.tsx) with a custom
// top navigation bar (header) and bottom navigation bar built directly
// with React Native components, so we don't need the native tab bar
// (AppTabs) here - it would just draw a second, duplicate nav bar.
// "login" is a separate stack screen shown before the user is authenticated.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
