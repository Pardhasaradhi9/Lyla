/**
 * Root Layout — Lyla
 *
 * Configures the navigation stack, dark theme, network listener,
 * and system UI (status bar, background color).
 */
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { useAppStore } from '@/stores/app-store';
import { onNetworkChange, isOnline } from '@/utils/network';
import { initDatabase } from '@/db/database';

// Set the root background to match our dark theme
SystemUI.setBackgroundColorAsync(colors.background.primary);

LogBox.ignoreLogs([
  'Result accumulator timeout',
  'Attempted to update accumulator',
  'VirtualizedList',
]);

export default function RootLayout() {
  const setIsOnline = useAppStore((s) => s.setIsOnline);
  const setIsAppReady = useAppStore((s) => s.setIsAppReady);

  useEffect(() => {
    // Initialize database (creates tables if they don't exist)
    initDatabase()
      .then(() => console.log('[App] Database ready'))
      .catch((e) => console.error('[App] Database init failed:', e));

    // Check initial network state
    isOnline().then(setIsOnline);

    // Subscribe to network changes
    const unsubscribe = onNetworkChange(setIsOnline);

    // Mark app as ready
    setIsAppReady(true);

    return () => {
      unsubscribe();
    };
  }, [setIsOnline, setIsAppReady]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="history" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
