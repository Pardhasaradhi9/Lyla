/**
 * Root Layout — Lyla
 *
 * Configures the navigation stack, dark theme, network listener,
 * and system UI (status bar, background color).
 */
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/theme/colors';
import { useAppStore } from '@/stores/app-store';
import { useSettingsStore } from '@/stores/settings-store';
import { onNetworkChange, isOnline } from '@/utils/network';
import { initDatabase } from '@/db/database';
import { isBiometricAvailable, authenticate } from '@/tools/biometric-lock';

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
  const biometricLockEnabled = useSettingsStore((s) => s.biometricLockEnabled);
  const [isLocked, setIsLocked] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => {
        console.log('[App] Database ready');
        // Evict expired knowledge cache entries on app start
        import('@/knowledge/cache').then(({ evictExpired }) => {
          if (evictExpired) evictExpired();
        }).catch(() => {});
      })
      .catch((e) => console.error('[App] Database init failed:', e));

    import('expo-av').then(({ Audio, InterruptionModeIOS, InterruptionModeAndroid }) => {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      }).catch(e => console.warn('[App] Audio ducking setup failed:', e));
    });

    isOnline().then(setIsOnline);
    const unsubscribe = onNetworkChange(setIsOnline);
    setIsAppReady(true);

    return () => {
      unsubscribe();
    };
  }, [setIsOnline, setIsAppReady]);

  useEffect(() => {
    if (!biometricLockEnabled) {
      setIsLocked(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const available = await isBiometricAvailable();
      if (!available || cancelled) {
        setIsLocked(false);
        return;
      }
      setIsAuthenticating(true);
      const success = await authenticate('Unlock Lyla');
      if (!cancelled) {
        setIsLocked(!success);
        setIsAuthenticating(false);
      }
    })();

    return () => { cancelled = true; };
  }, [biometricLockEnabled]);

  if (isLocked && biometricLockEnabled) {
    return (
      <View style={lockStyles.container}>
        <StatusBar style="dark" />
        <Text style={lockStyles.title}>Lyla</Text>
        {isAuthenticating ? (
          <ActivityIndicator color={colors.accent.primary} size="large" />
        ) : (
          <Pressable style={lockStyles.unlockButton} onPress={async () => {
            setIsAuthenticating(true);
            const success = await authenticate('Unlock Lyla');
            setIsLocked(!success);
            setIsAuthenticating(false);
          }}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.accent.primary} />
            <Text style={lockStyles.unlockText}>Tap to unlock</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="chat" />
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

const lockStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  unlockButton: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  unlockText: {
    fontSize: 16,
    color: colors.accent.primary,
  },
});
