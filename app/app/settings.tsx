/**
 * Settings Screen (Placeholder)
 *
 * Will contain: model selection, voice settings, memory viewer,
 * about info, and privacy controls.
 */
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { APP } from '@/utils/constants';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────── */}
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
        {/* ── Model Section ──────────────────────────────────────── */}
        <SettingsSection title="AI Model">
          <SettingsRow
            icon="hardware-chip-outline"
            label="Active Model"
            value="Not loaded"
          />
          <SettingsRow
            icon="swap-horizontal-outline"
            label="Switch Model"
            value="Qwen3 1.7B"
          />
          <SettingsRow
            icon="bulb-outline"
            label="Thinking Mode"
            value="Off"
          />
        </SettingsSection>

        {/* ── Voice Section ──────────────────────────────────────── */}
        <SettingsSection title="Voice">
          <SettingsRow
            icon="volume-high-outline"
            label="Auto-play responses"
            value="Off"
          />
          <SettingsRow
            icon="speedometer-outline"
            label="Speech rate"
            value="0.9x"
          />
        </SettingsSection>

        {/* ── Memory Section ─────────────────────────────────────── */}
        <SettingsSection title="Memory">
          <SettingsRow
            icon="brain-outline"
            label="Memory enabled"
            value="On"
          />
          <SettingsRow
            icon="list-outline"
            label="View memories"
            value="0 facts"
          />
          <SettingsRow
            icon="trash-outline"
            label="Clear all memories"
            value=""
            destructive
          />
        </SettingsSection>

        {/* ── About ──────────────────────────────────────────────── */}
        <SettingsSection title="About">
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy"
            value="100% on-device"
          />
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

// ── Reusable Components ─────────────────────────────────────────

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
    <Pressable style={styles.row} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons
        name={icon as any}
        size={20}
        color={destructive ? colors.status.error : colors.accent.primaryLight}
      />
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
    </Pressable>
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
  // ── Section ─────────────────────────────────────────────────
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
  // ── Row ─────────────────────────────────────────────────────
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
});
