/**
 * Root Layout — Lyla
 *
 * Configures the navigation stack, dark theme, network listener,
 * and system UI (status bar, background color).
 */
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { useAppStore } from '@/stores/app-store';
import { onNetworkChange, isOnline } from '@/utils/network';

// Set the root background to match our dark theme
SystemUI.setBackgroundColorAsync(colors.background.primary);

export default function RootLayout() {
  const setIsOnline = useAppStore((s) => s.setIsOnline);
  const setIsAppReady = useAppStore((s) => s.setIsAppReady);

  useEffect(() => {
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
