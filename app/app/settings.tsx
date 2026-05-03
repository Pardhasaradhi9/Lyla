import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Switch, Alert } from 'react-native';
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

function statusLabel(s: string): string {
  switch (s) {
    case 'ready': return 'Ready';
    case 'downloading': return 'Downloading...';
    case 'loading': return 'Loading...';
    case 'error': return 'Error';
    default: return 'Not downloaded';
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const modelStatus = useAppStore((s) => s.modelStatus);
  const routerStatus = useAppStore((s) => s.routerStatus);
  const brainStatus = useAppStore((s) => s.brainStatus);
  const activeModel = useAppStore((s) => s.activeModel);
  const { autoPlayTTS, ttsRate, memoryEnabled, hapticsEnabled, biometricLockEnabled, knowledgeEnabled,
    setAutoPlayTTS, setMemoryEnabled, setHapticsEnabled, setBiometricLockEnabled, setKnowledgeEnabled } = useSettingsStore();
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
        <Pressable style={styles.closeButton} onPress={() => router.back()} accessibilityLabel="Close settings">
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <SettingsSection title="AI Models">
          <ModelRow icon="flash-outline" label="Router" model={MODELS.SPEED_LLM.name} size="229 MB" status={routerStatus} active={activeModel === 'router'} />
          <ModelRow icon="hardware-chip-outline" label="Brain" model={MODELS.PRIMARY_LLM.name} size="960 MB" status={brainStatus} active={activeModel === 'brain'} />
        </SettingsSection>

        <SettingsSection title="Knowledge Hub">
          <SettingsToggleRow icon="globe-outline" label="Knowledge enabled" value={knowledgeEnabled} onValueChange={setKnowledgeEnabled} />
          <View style={styles.knowledgeInfo}>
            <Text style={styles.knowledgeInfoTitle}>Available sources:</Text>
            {[
              { icon: 'partly-sunny-outline', name: 'Weather (Open-Meteo)' },
              { icon: 'earth-outline', name: 'Countries (REST Countries)' },
              { icon: 'book-outline', name: 'Books (Open Library)' },
              { icon: 'search-outline', name: 'Wikipedia + Wikidata' },
              { icon: 'document-text-outline', name: 'Research Papers (OpenAlex)' },
              { icon: 'text-outline', name: 'Dictionary (Free Dictionary API)' },
              { icon: 'swap-horizontal-outline', name: 'Currency (ExchangeRate)' },
              { icon: 'calendar-outline', name: 'Holidays (Nager.Date)' },
            ].map((s, i) => (
              <View key={i} style={styles.sourceRow}>
                <Ionicons name={s.icon as any} size={16} color={colors.text.tertiary} />
                <Text style={styles.sourceText}>{s.name}</Text>
              </View>
            ))}
            <Text style={styles.knowledgeHint}>Tap the 🌐 icon in chat to activate knowledge for a question.</Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Performance">
          <View style={styles.perfInfo}>
            <Text style={styles.perfText}>Response speed depends on your device RAM:</Text>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>6 GB+ RAM</Text>
              <Text style={styles.perfValue}>Both models loaded (2-4s responses)</Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>4-6 GB RAM</Text>
              <Text style={styles.perfValue}>Model swapping (4-8s responses)</Text>
            </View>
            <Text style={styles.perfNote}>Knowledge API calls are instant. Brain synthesis adds 2-5s.</Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Voice">
          <SettingsToggleRow icon="volume-high-outline" label="Auto-play responses" value={autoPlayTTS} onValueChange={setAutoPlayTTS} />
          <View style={styles.row}>
            <Ionicons name="speedometer-outline" size={20} color={colors.accent.primaryLight} />
            <Text style={styles.rowLabel}>Speech rate</Text>
            <View style={styles.rateButtons}>
              <Pressable style={styles.rateButton} onPress={() => useSettingsStore.getState().setTTSRate(Math.max(0.5, ttsRate - 0.1))}>
                <Text style={styles.rateButtonText}>-</Text>
              </Pressable>
              <Text style={styles.rateValue}>{ttsRate.toFixed(1)}x</Text>
              <Pressable style={styles.rateButton} onPress={() => useSettingsStore.getState().setTTSRate(Math.min(2.0, ttsRate + 0.1))}>
                <Text style={styles.rateButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title="Haptics">
          <SettingsToggleRow icon="phone-vibrate" label="Haptic feedback" value={hapticsEnabled} onValueChange={setHapticsEnabled} />
        </SettingsSection>

        <SettingsSection title="Memory">
          <SettingsToggleRow icon="sparkles-outline" label="Memory enabled" value={memoryEnabled} onValueChange={setMemoryEnabled} />
          <SettingsRow icon="list-outline" label="Saved memories" value={`${memoryCount} fact${memoryCount !== 1 ? 's' : ''}`} />
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
          <SettingsToggleRow icon="lock-closed-outline" label="Biometric lock" value={biometricLockEnabled} onValueChange={setBiometricLockEnabled} />
          <SettingsRow icon="shield-checkmark-outline" label="Privacy" value="100% on-device" />
        </SettingsSection>

        <SettingsSection title="Legal">
          <View style={styles.legalSection}>
            <Text style={styles.legalTitle}>AI Accuracy</Text>
            <Text style={styles.legalText}>Lyla may produce inaccurate responses. Not a substitute for professional medical, legal, or financial advice.</Text>

            <Text style={styles.legalTitle}>Third-Party Data</Text>
            <Text style={styles.legalText}>Knowledge Hub sources information from public APIs (Wikipedia, Open-Meteo, Open Library, etc.). Content belongs to respective sources. Lyla is not affiliated with any data source.</Text>

            <Text style={styles.legalTitle}>Privacy</Text>
            <Text style={styles.legalText}>All processing happens on your device. We do not collect, store, or transmit personal data. Conversations stay local.</Text>

            <Text style={styles.legalTitle}>Usage Responsibility</Text>
            <Text style={styles.legalText}>You are responsible for how you use AI-generated content. Do not use Lyla for illegal purposes or to generate harmful content.</Text>
          </View>
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow icon="information-circle-outline" label="Version" value={`v${APP.VERSION}`} />
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

function SettingsRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={20} color={colors.accent.primaryLight} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function SettingsToggleRow({ icon, label, value, onValueChange }: { icon: string; label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={20} color={colors.accent.primaryLight} />
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

function ModelRow({ icon, label, model, size, status, active }: { icon: string; label: string; model: string; size: string; status: string; active: boolean }) {
  const isReady = status === 'ready';
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={20} color={colors.accent.primaryLight} />
      <View style={styles.modelInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.modelSub}>{model} · {size}</Text>
      </View>
      <Text style={[styles.rowValue, { color: isReady ? colors.status.success : colors.text.tertiary }]}>
        {active ? '● ' : ''}{statusLabel(status)}
      </Text>
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
    gap: spacing.xl,
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
  rowValue: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  modelInfo: {
    flex: 1,
  },
  modelSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  knowledgeInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  knowledgeInfoTitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  sourceText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  knowledgeHint: {
    ...typography.caption,
    color: colors.accent.primaryLight,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  perfInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  perfText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  perfLabel: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  perfValue: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  perfNote: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  rateButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rateButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateButtonText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  rateValue: {
    ...typography.bodySmall,
    color: colors.text.primary,
    minWidth: 36,
    textAlign: 'center',
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
  legalSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  legalTitle: {
    ...typography.label,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  legalText: {
    ...typography.caption,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
});
