import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { chatRepository, type ConversationRow } from '@/db/chat-repository';
import { useChatStore, type Message } from '@/stores/chat-store';
import { useAppStore } from '@/stores/app-store';
import { MODELS } from '@/utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

const FEATURES = [
  { icon: 'globe-outline', title: 'Knowledge Hub', desc: 'Weather, books, science, currencies & more', color: colors.accent.secondary },
  { icon: 'calculator-outline', title: 'Calculator', desc: 'Math, conversions, percentages', color: '#8C877E' },
  { icon: 'calendar-outline', title: 'Calendar', desc: 'Check schedule, create events', color: '#D4A373' },
  { icon: 'sparkles', title: 'Memory', desc: 'I remember what you tell me', color: '#7DA4B5' },
  { icon: 'lock-closed-outline', title: 'Privacy', desc: '100% on-device, nothing leaves', color: colors.accent.primary },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { loadConversation, clearChat } = useChatStore();
  const modelStatus = useAppStore((s) => s.modelStatus);
  const routerStatus = useAppStore((s) => s.routerStatus);
  const brainStatus = useAppStore((s) => s.brainStatus);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await chatRepository.getConversations(5);
      setConversations(data);
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewChat = () => {
    clearChat();
    router.push('/chat');
  };

  const handleLoadConversation = async (convo: ConversationRow) => {
    try {
      const dbMessages = await chatRepository.getMessages(convo.id);
      const msgs: Message[] = dbMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      }));
      loadConversation(convo.id, msgs);
      router.push('/chat');
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Lyla</Text>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push('/settings')}
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
        <Text style={styles.subtitle}>What can I help you with?</Text>

        <View style={styles.statusBar}>
          <View style={[styles.statusDot, { backgroundColor: modelStatus === 'ready' ? colors.status.success : colors.status.warning }]} />
          <Text style={styles.statusText}>
            {modelStatus === 'ready'
              ? routerStatus === 'ready' && brainStatus === 'ready'
                ? 'All systems ready'
                : brainStatus === 'ready'
                  ? 'Brain ready'
                  : 'Loading...'
              : 'Setting up...'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Capabilities</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        >
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '20' }]}>
                <Ionicons name={f.icon as any} size={24} color={f.color} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Chats</Text>
          {conversations.length > 0 && (
            <Pressable onPress={() => router.push('/history')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent.primary} style={styles.loader} />
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        ) : (
          conversations.map((convo) => {
            const title = convo.title || 'New Chat';
            const date = new Date(convo.updated_at);
            const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return (
              <Pressable
                key={convo.id}
                style={styles.chatRow}
                onPress={() => handleLoadConversation(convo)}
              >
                <View style={styles.chatIcon}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.accent.primaryLight} />
                </View>
                <View style={styles.chatTextContainer}>
                  <Text style={styles.chatTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.chatDate}>{dateStr}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
              </Pressable>
            );
          })
        )}

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.newChatButton} onPress={handleNewChat}>
          <Ionicons name="create-outline" size={20} color={colors.text.inverse} />
          <Text style={styles.newChatText}>New Chat</Text>
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
  },
  logoText: {
    ...typography.headingLarge,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  greeting: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  seeAll: {
    ...typography.caption,
    color: colors.accent.primary,
  },
  cardsRow: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  featureCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featureDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  chatIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  chatTextContainer: {
    flex: 1,
  },
  chatTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  chatDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  spacer: {
    height: spacing.xl,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.primary,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  newChatText: {
    ...typography.label,
    color: colors.text.inverse,
  },
});
