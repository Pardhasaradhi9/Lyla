/**
 * Home Screen — Chat Interface (Placeholder)
 *
 * This will become the main chat screen with:
 * - Message list (FlatList, inverted)
 * - Input bar with send + mic buttons
 * - Model status indicator
 * - Online/offline badge
 */
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { useAppStore } from '@/stores/app-store';

export default function HomeScreen() {
  const router = useRouter();
  const isOnline = useAppStore((s) => s.isOnline);
  const modelStatus = useAppStore((s) => s.modelStatus);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Lyla</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? colors.status.success : colors.status.offline },
              ]}
            />
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.statusSeparator}>·</Text>
            <Text style={styles.statusText}>
              {modelStatus === 'ready' ? '🧠 Model Ready' : '⏳ Model: ' + modelStatus}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/history')}
            accessibilityLabel="Chat history"
            accessibilityRole="button"
          >
            <Ionicons name="time-outline" size={22} color={colors.text.secondary} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={22} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* ── Chat Area (placeholder) ─────────────────────────────── */}
      <View style={styles.chatArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyTitle}>Everything stays on your device</Text>
          <Text style={styles.emptySubtitle}>
            No cloud. No subscriptions. No data leaves your phone.
          </Text>
          <View style={styles.privacyBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.accent.primary} />
            <Text style={styles.privacyText}>100% Private · On-Device AI</Text>
          </View>
        </View>
      </View>

      {/* ── Input Bar (placeholder) ─────────────────────────────── */}
      <View style={styles.inputBar}>
        <View style={styles.inputField}>
          <Text style={styles.inputPlaceholder}>Message Lyla...</Text>
        </View>
        <Pressable
          style={styles.micButton}
          accessibilityLabel="Voice input"
          accessibilityRole="button"
        >
          <Ionicons name="mic" size={22} color={colors.text.primary} />
        </Pressable>
        <Pressable
          style={styles.sendButton}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-up" size={20} color={colors.text.inverse} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  // ── Header ────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  statusSeparator: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Chat Area ─────────────────────────────────────────────────
  chatArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  privacyText: {
    ...typography.label,
    color: colors.accent.primaryLight,
  },
  // ── Input Bar ─────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  inputField: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  inputPlaceholder: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
