import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

// เส้นทางที่เข้าได้โดยไม่ต้อง login (public routes)
const PUBLIC_ROUTES = ['login', 'register'];

// ทำหน้าที่ guard การเข้าถึงหน้าทุกหน้าในแอปแบบรวมศูนย์ที่เดียว
// (แทนที่จะเขียนเช็ค user ซ้ำในแต่ละหน้า เช่น index.tsx / profile.tsx)
// - ถ้ายังไม่ login และพยายามเข้าหน้าที่ต้อง login -> เด้งไป /login
// - ถ้า login อยู่แล้วแต่ดันไปเปิดหน้า /login หรือ /register -> เด้งกลับหน้าแรก
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // รอเช็ค session ที่เคย login ค้างไว้ให้เสร็จก่อน

    const currentRoute = segments[0] ?? 'index';
    const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute);

    if (!user && !isPublicRoute) {
      // ยังไม่ login และพยายามเข้าหน้าที่ต้อง login (ไม่ว่าจะเป็นหน้าไหนก็ตาม)
      router.replace('/login');
    } else if (user && isPublicRoute) {
      // login อยู่แล้ว แต่เปิดหน้า login/register ค้างอยู่
      router.replace('/');
    }
  }, [isLoading, user, segments, router]);

  // ระหว่างเช็ค session ครั้งแรก ให้โชว์ loading เฉยๆ กันไม่ให้เห็นเนื้อหาหน้าอื่นวาบขึ้นมาก่อน
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

// This app uses a single screen (src/app/index.tsx) with a custom
// top navigation bar (header) and bottom navigation bar built directly
// with React Native components, so we don't need the native tab bar
// (AppTabs) here - it would just draw a second, duplicate nav bar.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="profile" />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
