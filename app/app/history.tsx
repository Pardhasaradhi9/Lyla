/**
 * Chat History Screen (Placeholder)
 *
 * Will list past conversations with titles, timestamps,
 * and swipe-to-delete functionality.
 */
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Empty State ─────────────────────────────────────────── */}
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={64} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          Your chat history will appear here. All conversations are stored locally on your device.
        </Text>
        <Pressable
          style={styles.startButton}
          onPress={() => router.back()}
          accessibilityLabel="Start chatting"
          accessibilityRole="button"
        >
          <Text style={styles.startButtonText}>Start Chatting</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 44,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  startButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.lg,
    minHeight: 48,
    justifyContent: 'center',
  },
  startButtonText: {
    ...typography.label,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
