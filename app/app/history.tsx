/**
 * Chat History Screen
 *
 * Lists past conversations with titles and timestamps.
 * Tapping a conversation loads it into the main chat.
 * Tapping the delete icon deletes it from the database.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { chatRepository, type ConversationRow } from '@/db/chat-repository';
import { useChatStore, type Message } from '@/stores/chat-store';

export default function HistoryScreen() {
  const router = useRouter();
  const { loadConversation } = useChatStore();

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations on mount
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await chatRepository.getConversations(100);
      setConversations(data);
    } catch (e) {
      console.error('[History] Failed to load conversations:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load a conversation and return to chat
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
      router.back();
    } catch (e) {
      console.error('[History] Failed to load messages:', e);
      Alert.alert('Error', 'Failed to load this conversation.');
    }
  };

  // Delete a conversation
  const handleDeleteConversation = (convo: ConversationRow) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatRepository.deleteConversation(convo.id);
              
              // If the deleted conversation is currently active, clear it
              const currentId = useChatStore.getState().conversationId;
              if (currentId === convo.id) {
                useChatStore.getState().clearChat();
              }
              
              // Refresh list
              fetchConversations();
            } catch (e) {
              console.error('[History] Failed to delete conversation:', e);
            }
          },
        },
      ]
    );
  };

  // Render a single conversation row
  const renderItem = ({ item }: { item: ConversationRow }) => {
    const title = item.title || 'New Chat';
    // Format date: "Today 10:30 AM" or "Apr 30, 10:30 AM"
    const date = new Date(item.updated_at);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    return (
      <View style={styles.row}>
        <Pressable 
          style={styles.rowContent}
          onPress={() => handleLoadConversation(item)}
        >
          <View style={styles.rowIcon}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.accent.primaryLight} />
          </View>
          <View style={styles.rowTextContainer}>
            <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.rowDate}>{dateStr}</Text>
          </View>
        </Pressable>
        <Pressable 
          style={styles.deleteButton}
          onPress={() => handleDeleteConversation(item)}
          accessibilityRole="button"
          accessibilityLabel="Delete conversation"
        >
          <Ionicons name="trash-outline" size={20} color={colors.text.tertiary} />
        </Pressable>
      </View>
    );
  };

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

      {/* ── List ────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContainer}>
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
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  centerContainer: {
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
  listContent: {
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  rowDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
