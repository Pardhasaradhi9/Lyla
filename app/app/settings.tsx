/**
 * Settings Screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { APP, MODELS } from '@/utils/constants';
import { useAppStore } from '@/stores/app-store';
import { useSettingsStore } from '@/stores/settings-store';
import { memoryEngine } from '@/engines/memory';
import { memoryRepository } from '@/db/memory-repository';

export default function SettingsScreen() {
  const router = useRouter();
  const modelStatus = useAppStore((s) => s.modelStatus);
  const { autoPlayTTS, ttsRate, memoryEnabled, hapticsEnabled, biometricLockEnabled, setAutoPlayTTS, setMemoryEnabled, setHapticsEnabled, setBiometricLockEnabled } = useSettingsStore();
  const [memoryCount, setMemoryCount] = useState(0);

  useEffect(() => {
    memoryEngine.getAllMemories()
      .then(memories => setMemoryCount(memories.length))
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Pressable
          style={styles.closeButton}
          onPress={() => router.back()}
          accessibilityLabel="Close settings"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <SettingsSection title="AI Model">
          <SettingsRow
            icon="hardware-chip-outline"
            label="Active Model"
            value={modelStatus === 'ready' ? MODELS.PRIMARY_LLM.name : modelStatus}
          />
          <SettingsRow
            icon="resize-outline"
            label="Model Size"
            value={`${(MODELS.PRIMARY_LLM.sizeBytes / 1_000_000).toFixed(0)} MB`}
          />
          <SettingsRow
            icon="bulb-outline"
            label="Status"
            value={modelStatus === 'ready' ? '🧠 Ready' : '⏳ ' + modelStatus}
          />
        </SettingsSection>

        <SettingsSection title="Voice">
          <SettingsToggleRow
            icon="volume-high-outline"
            label="Auto-play responses"
            value={autoPlayTTS}
            onValueChange={setAutoPlayTTS}
          />
          <SettingsRow
            icon="speedometer-outline"
            label="Speech rate"
            value={`${ttsRate}x`}
          />
        </SettingsSection>

        <SettingsSection title="Haptics">
          <SettingsToggleRow
            icon="phone-vibrate-outline"
            label="Haptic feedback"
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
          />
        </SettingsSection>

        <SettingsSection title="Memory">
          <SettingsToggleRow
            icon="sparkles-outline"
            label="Memory enabled"
            value={memoryEnabled}
            onValueChange={setMemoryEnabled}
          />
          <SettingsRow
            icon="list-outline"
            label="Saved memories"
            value={`${memoryCount} fact${memoryCount !== 1 ? 's' : ''}`}
          />
          {memoryCount > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                Alert.alert(
                  'Clear All Memories',
                  'This will permanently delete all saved memories. This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear All',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await memoryRepository.deleteAllMemories();
                          setMemoryCount(0);
                        } catch (e) {
                          console.warn('[Settings] Clear memories failed:', e);
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.status.error} />
              <Text style={styles.clearButtonText}>Clear All Memories</Text>
            </Pressable>
          )}
        </SettingsSection>

        <SettingsSection title="Security">
          <SettingsToggleRow
            icon="lock-closed-outline"
            label="Biometric lock"
            value={biometricLockEnabled}
            onValueChange={setBiometricLockEnabled}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy"
            value="100% on-device"
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow
            icon="information-circle-outline"
            label="Version"
            value={`v${APP.VERSION}`}
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  destructive,
}: {
  icon: string;
  label: string;
  value: string;
  destructive?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Ionicons
        name={icon as any}
        size={20}
        color={destructive ? colors.status.error : colors.accent.primaryLight}
      />
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function SettingsToggleRow({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Ionicons
        name={icon as any}
        size={20}
        color={colors.accent.primaryLight}
      />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }}
        thumbColor="#fff"
        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  rowLabelDestructive: {
    color: colors.status.error,
  },
  rowValue: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    gap: spacing.md,
  },
  clearButtonText: {
    ...typography.bodyMedium,
    color: colors.status.error,
    flex: 1,
  },
});
