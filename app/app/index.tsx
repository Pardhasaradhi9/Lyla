import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, TextInput, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { useAppStore, type ModelStatus } from '@/stores/app-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useChatStore, Message } from '@/stores/chat-store';
import { llmEngine } from '@/engines/llm';
import { routerEngine } from '@/engines/router';
import { embeddingEngine } from '@/engines/embeddings';
import { swapToBrain, swapToRouter } from '@/engines/model-swapper';
import { downloadModel, modelExists, getModelPath } from '@/utils/model-manager';
import { MODELS } from '@/utils/constants';
import Markdown from 'react-native-markdown-display';
import { createOrchestrator, type Orchestrator } from '@/orchestrator';
import { chatRepository } from '@/db/chat-repository';
import { hapticLight, hapticSuccess, hapticError, hapticSelection } from '@/utils/haptics';
import { speak, stopSpeaking } from '@/engines/tts';

export default function HomeScreen() {
  const router = useRouter();
  
  // App State
  const isOnline = useAppStore((s) => s.isOnline);
  const modelStatus = useAppStore((s) => s.modelStatus);
  const setModelStatus = useAppStore((s) => s.setModelStatus);
  const routerStatus = useAppStore((s) => s.routerStatus);
  const setRouterStatus = useAppStore((s) => s.setRouterStatus);
  const brainStatus = useAppStore((s) => s.brainStatus);
  const setBrainStatus = useAppStore((s) => s.setBrainStatus);
  const isSwapping = useAppStore((s) => s.isSwapping);
  const setIsSwapping = useAppStore((s) => s.setIsSwapping);
  const modelDownloadProgress = useAppStore((s) => s.modelDownloadProgress);
  const setModelDownloadProgress = useAppStore((s) => s.setModelDownloadProgress);
  const downloadingPhase = useAppStore((s) => s.downloadingPhase);
  const setDownloadingPhase = useAppStore((s) => s.setDownloadingPhase);

  // Chat State
  const { messages, addMessage, updateLastMessage, isGenerating, setIsGenerating, conversationId, setConversationId, loadConversation } = useChatStore();
  const { autoPlayTTS, hapticsEnabled } = useSettingsStore();
  
  // Knowledge toggle state
  const [knowledgeActive, setKnowledgeActive] = useState(false);
  
  function maybeHaptic(fn: () => void) {
    if (hapticsEnabled) fn();
  }
  
  // Local UI State
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const orchestratorRef = useRef<Orchestrator | null>(null);

  // Create orchestrator (connects to LLM engine + Router + Knowledge)
  useEffect(() => {
    orchestratorRef.current = createOrchestrator({
      streamCompletion: (messages, onToken, sysPrompt) => llmEngine.complete(messages, onToken, sysPrompt),
      isModelReady: () => llmEngine.isLoaded,
      isRouterReady: () => routerEngine.isLoaded,
      routerClassify: (msg) => routerEngine.classify(msg),
      swapToBrain: async () => {
        setIsSwapping(true);
        try { await swapToBrain(); } finally { setIsSwapping(false); }
      },
      swapToRouter: async () => {
        setIsSwapping(true);
        try { await swapToRouter(); } finally { setIsSwapping(false); }
      },
      llmExtractFacts: async (userMsg, assistantMsg) => {
        if (!routerEngine.isLoaded) return [];
        return routerEngine.extractFacts(userMsg, assistantMsg);
      },
      knowledgeEnabled: () => useSettingsStore.getState().knowledgeEnabled,
    });
  }, []);



  // ── Initialization ────────────────────────────────────────────────
  useEffect(() => {
    const initModels = async () => {
      try {
        // 1. Init Router (350M) — loaded first, always ready
        const routerFileName = MODELS.SPEED_LLM.fileName;
        if (await modelExists(routerFileName)) {
          setRouterStatus('loading');
          const path = await getModelPath(routerFileName);
          await routerEngine.init(path);
          setRouterStatus('ready');
        } else {
          setRouterStatus('not_downloaded');
        }

        // 2. Init Brain (1.2B) — loaded on demand, check if already downloaded
        const brainFileName = MODELS.PRIMARY_LLM.fileName;
        if (await modelExists(brainFileName)) {
          setBrainStatus('loading');
          const path = await getModelPath(brainFileName);
          await llmEngine.init(path);
          setBrainStatus('ready');
          setModelStatus('ready');
        } else {
          setBrainStatus('not_downloaded');
          // If no brain but router exists, still mark ready (Router mode)
          if (routerEngine.isLoaded) {
            setModelStatus('ready');
          } else {
            setModelStatus('not_downloaded');
          }
        }

        // 3. Init Embedding Engine (Background)
        const embedFileName = MODELS.EMBEDDING.fileName;
        if (await modelExists(embedFileName)) {
          console.log('[Chat] Loading embedding model...');
          const embedPath = await getModelPath(embedFileName);
          await embeddingEngine.init(embedPath);
        } else {
          console.log('[Chat] Embedding model not found. Downloading in background...');
          downloadModel(
            MODELS.EMBEDDING.url,
            MODELS.EMBEDDING.fileName,
            () => {}
          ).then(uri => {
            console.log('[Chat] Embedding model downloaded, initializing...');
            return embeddingEngine.init(uri);
          }).catch(e => console.warn('[Chat] Failed to download embedding model:', e));
        }

      } catch (e) {
        console.error('Initialization error:', e);
        setModelStatus('error');
      }
    };
    
    if (modelStatus === 'not_downloaded') {
       initModels();
    }
  }, []);

  const handleDownloadAll = async () => {
    const steps: Array<{ key: string; label: string; config: { url: string; fileName: string }; phase: 'router' | 'brain'; init: (uri: string) => Promise<void>; setStatus: (s: ModelStatus) => void }> = [];

    if (routerStatus === 'not_downloaded') {
      steps.push({
        key: 'router',
        label: 'Router (229 MB)',
        config: MODELS.SPEED_LLM,
        phase: 'router',
        init: (uri) => routerEngine.init(uri),
        setStatus: setRouterStatus,
      });
    }
    if (brainStatus === 'not_downloaded') {
      steps.push({
        key: 'brain',
        label: 'Brain (918 MB)',
        config: MODELS.PRIMARY_LLM,
        phase: 'brain',
        init: (uri) => llmEngine.init(uri),
        setStatus: setBrainStatus,
      });
    }

    for (const step of steps) {
      console.log(`[Download] Starting: ${step.label}`);
      setDownloadingPhase(step.phase);
      step.setStatus('downloading');

      try {
        const uri = await downloadModel(
          step.config.url,
          step.config.fileName,
          (progress) => setModelDownloadProgress(progress),
        );
        console.log(`[Download] Finished: ${step.label}`);
        step.setStatus('loading');
        await step.init(uri);
        step.setStatus('ready');
        console.log(`[Download] Loaded into memory: ${step.label}`);
      } catch (e) {
        console.error(`[Download] FAILED: ${step.label}`, e);
        step.setStatus('error');
        setDownloadingPhase('idle');
        return;
      }
    }

    setDownloadingPhase('loading');

    const embedFileName = MODELS.EMBEDDING.fileName;
    if (!(await modelExists(embedFileName))) {
      console.log('[Download] Starting: Embedding (59 MB)');
      setDownloadingPhase('embedding');
      try {
        const uri = await downloadModel(
          MODELS.EMBEDDING.url,
          MODELS.EMBEDDING.fileName,
          (progress) => setModelDownloadProgress(progress),
        );
        await embeddingEngine.init(uri);
        console.log('[Download] Loaded into memory: Embedding');
      } catch (e) {
        console.warn('[Download] Embedding failed (non-critical):', e);
      }
    } else if (!embeddingEngine.isLoaded) {
      try {
        const embedPath = await getModelPath(embedFileName);
        await embeddingEngine.init(embedPath);
        console.log('[Download] Loaded into memory: Embedding (cached)');
      } catch (e) {
        console.warn('[Download] Embedding init failed (non-critical):', e);
      }
    }

    if (routerEngine.isLoaded && llmEngine.isLoaded) {
      console.log('[Download] All models ready ✓');
    } else if (llmEngine.isLoaded) {
      console.log('[Download] Brain ready ✓, Router failed ✗');
    } else if (routerEngine.isLoaded) {
      console.log('[Download] Router ready ✓, Brain failed ✗');
    }

    setModelDownloadProgress(1);
    setDownloadingPhase('done');
    setModelStatus('ready');
  };

  // ── Actions ─────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isGenerating) return;

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    };
    
    addMessage(userMsg);
    setInputText('');
    setIsGenerating(true);
    maybeHaptic(() => hapticLight());
    
    const assistantMsgId = (Date.now() + 1).toString();
    addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      isStreaming: true,
    });

    // ── Persist to SQLite ──
    let activeConvoId = conversationId;
    try {
      if (!activeConvoId) {
        activeConvoId = await chatRepository.createConversation();
        setConversationId(activeConvoId);
      }
      await chatRepository.addMessage(activeConvoId, 'user', trimmed, userMsgId);
    } catch (dbError) {
      console.warn('[Chat] DB write failed (non-fatal):', dbError);
    }

    try {
      if (!orchestratorRef.current) {
        updateLastMessage('Orchestrator not ready. Please wait...', true);
        return;
      }

      // Build conversation history with token-aware trimming
      const currentMessages = useChatStore.getState().messages;
      const historyMessages = currentMessages
        .filter(m => m.id !== assistantMsgId && m.id !== userMsgId && m.role !== 'system');

      const MAX_CONTEXT_CHARS = 6000;
      let totalChars = 0;
      const trimmedHistory: typeof historyMessages = [];
      for (let i = historyMessages.length - 1; i >= 0; i--) {
        totalChars += historyMessages[i].content.length;
        if (totalChars > MAX_CONTEXT_CHARS) break;
        trimmedHistory.unshift(historyMessages[i]);
      }

      const conversationHistory = trimmedHistory.map(m => ({ role: m.role, content: m.content }));

      // Route through the orchestrator
      let streamedContent = '';
      const result = await orchestratorRef.current.processMessage(
        trimmed,
        conversationHistory,
        (token) => {
          streamedContent += token;
          updateLastMessage(streamedContent);
        },
        { knowledgeActive: knowledgeActive },
      );

      const finalContent = result.response || streamedContent;
      updateLastMessage(finalContent, true);
      setKnowledgeActive(false);

      if (autoPlayTTS && finalContent) {
        speak(finalContent, {
          rate: useSettingsStore.getState().ttsRate,
          pitch: useSettingsStore.getState().ttsPitch,
          language: useSettingsStore.getState().ttsLanguage,
        });
      }

      // ── Persist assistant response to SQLite ──
      if (activeConvoId && finalContent) {
        chatRepository.addMessage(activeConvoId, 'assistant', finalContent, assistantMsgId)
          .then(() => {
            return chatRepository.generateTitle(activeConvoId!).then(title => {
              return chatRepository.updateConversation(activeConvoId!, title);
            });
          })
          .catch(e => console.warn('[Chat] DB persist failed:', e));
      }

      if (__DEV__) {
        console.log(`[Orchestrator] Intent: ${result.intent} | Handler: ${result.handledBy}`);
      }
    } catch (e) {
      console.error('Completion error:', e);
      maybeHaptic(() => hapticError());
      updateLastMessage('Sorry, I encountered an error. Could you try again?', true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Start a new conversation
  const handleNewChat = useCallback(() => {
    stopSpeaking();
    maybeHaptic(() => hapticSelection());
    const { clearChat } = useChatStore.getState();
    clearChat();
  }, [hapticsEnabled]);

  // ── Render Helpers ───────────────────────────────────────────────
  const MessageBubble = ({ item }: { item: Message }) => {
    const [showCopy, setShowCopy] = useState(false);
    const [copied, setCopied] = useState(false);
    const [memorySaved, setMemorySaved] = useState(false);
    const [tooLong, setTooLong] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isUser = item.role === 'user';
    const content = item.content;

    const markdownStyles = useMemo(() => ({
      body: {
        ...typography.bodyMedium,
        color: isUser ? colors.text.inverse : colors.text.primary,
        marginVertical: 0,
      },
      code_block: {
        backgroundColor: colors.background.tertiary,
        borderRadius: radius.md,
        padding: spacing.md,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      },
      code_inline: {
        backgroundColor: colors.background.tertiary,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.xs,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      },
      strong: {
        fontWeight: 'bold' as const,
      },
    }), [isUser]);

    const handleBubblePress = useCallback(() => {
      if (item.isStreaming) return;

      if (showCopy) {
        setShowCopy(false);
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        return;
      }

      setShowCopy(true);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setShowCopy(false), 3000);
    }, [item.isStreaming, showCopy]);

    const handleCopy = useCallback(async () => {
      if (!content) return;
      await Clipboard.setStringAsync(content);
      maybeHaptic(() => hapticSuccess());
      setCopied(true);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => {
        setCopied(false);
        setShowCopy(false);
      }, 1500);
    }, [content]);

    const handleSpeak = useCallback(async () => {
      if (!content || isUser) return;
      if (speaking) {
        stopSpeaking();
        setSpeaking(false);
        return;
      }
      setSpeaking(true);
      maybeHaptic(() => hapticLight());
      speak(content, {
        rate: useSettingsStore.getState().ttsRate,
        pitch: useSettingsStore.getState().ttsPitch,
        language: useSettingsStore.getState().ttsLanguage,
      });
      setTimeout(() => setSpeaking(false), content.length * 60 + 1000);
    }, [content, speaking, isUser]);

    const handleLongPress = useCallback(async () => {
      if (item.isStreaming || memorySaved || !content) return;

      if (content.length > 200) {
        setTooLong(true);
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => setTooLong(false), 2000);
        return;
      }

      try {
        const { memoryEngine } = require('@/engines/memory');
        const { extractFactOrRaw } = require('@/orchestrator/fact-extractor');
        const extracted = extractFactOrRaw(content);
        await memoryEngine.addMemory(extracted.fact, extracted.entity || undefined, extracted.category);
        maybeHaptic(() => hapticSuccess());
        setMemorySaved(true);
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => setMemorySaved(false), 2000);
      } catch (e) {
        console.warn('[Chat] Save to memory failed:', e);
      }
    }, [item.isStreaming, memorySaved, content]);

    const renderContent = () => {
      if (isUser) {
        return <Text style={styles.messageTextUser}>{content}</Text>;
      }
      return <Markdown style={markdownStyles}>{content}</Markdown>;
    };

    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAssistant]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Text style={styles.assistantAvatarText}>L</Text>
          </View>
        )}
        <Pressable
          style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant]}
          onPress={handleBubblePress}
          onLongPress={!item.isStreaming ? handleLongPress : undefined}
          delayLongPress={400}
        >
          {item.isStreaming && !content ? (
            <ActivityIndicator color={colors.text.inverse} size="small" />
          ) : (
            renderContent()
          )}
          {showCopy && !item.isStreaming && !copied && !memorySaved && (
            <View style={styles.feedbackRow}>
              {!isUser && (
                <Pressable style={styles.feedbackBadge} onPress={handleSpeak} hitSlop={8}>
                  <Ionicons name={speaking ? 'stop' : 'volume-high-outline'} size={14} color="#fff" />
                </Pressable>
              )}
              <Pressable style={styles.feedbackBadge} onPress={handleCopy} hitSlop={8}>
                <Ionicons name="copy-outline" size={14} color="#fff" />
              </Pressable>
            </View>
          )}
          {copied && (
            <View style={styles.feedbackBadge}>
              <Text style={styles.feedbackText}>Copied!</Text>
            </View>
          )}
          {memorySaved && (
            <View style={styles.feedbackBadge}>
              <Text style={styles.feedbackText}>Saved!</Text>
            </View>
          )}
          {tooLong && (
            <View style={styles.feedbackBadge}>
              <Text style={styles.feedbackText}>Too long to save</Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  const renderModelStatus = () => {
    if (modelStatus === 'ready') return null;

    const needsDownload = routerStatus === 'not_downloaded' || brainStatus === 'not_downloaded';
    const isActive = downloadingPhase !== 'idle' && downloadingPhase !== 'done';
    const phaseLabel: Record<string, string> = {
      router: 'Router (229 MB)',
      brain: 'Brain (918 MB)',
      embedding: 'Embedding (59 MB)',
      loading: 'Loading into memory...',
    };

    return (
      <View style={styles.modelStatusContainer}>
        {needsDownload && !isActive && (
          <View style={styles.downloadPrompt}>
            <Ionicons name="cloud-download-outline" size={32} color={colors.accent.primary} />
            <Text style={styles.downloadTitle}>Set Up Lyla</Text>
            <Text style={styles.downloadSubtitle}>
              Lyla needs her intelligence models to work. This is a one-time download that stays on your device.
            </Text>
            <Pressable style={styles.downloadButton} onPress={handleDownloadAll}>
              <Text style={styles.downloadButtonText}>Download Everything (~1.2 GB)</Text>
            </Pressable>
          </View>
        )}

        {isActive && (
          <View style={styles.downloadPrompt}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
            <Text style={styles.downloadTitle}>
              {downloadingPhase === 'loading' ? 'Almost ready...' : `Downloading ${phaseLabel[downloadingPhase] || ''}`}
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.round(modelDownloadProgress * 100)}%` }]} />
            </View>
            <Text style={styles.downloadSubtitle}>{Math.round(modelDownloadProgress * 100)}% — {phaseLabel[downloadingPhase] || 'Loading'}</Text>
          </View>
        )}

        {modelStatus === 'error' && (
          <View style={styles.downloadPrompt}>
            <Ionicons name="warning-outline" size={32} color={colors.status.error} />
            <Text style={styles.downloadTitle}>Something went wrong</Text>
            <Text style={styles.downloadSubtitle}>Check the console logs for details.</Text>
            <Pressable style={styles.downloadButton} onPress={() => { setModelStatus('not_downloaded'); setDownloadingPhase('idle'); }}>
              <Text style={styles.downloadButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
                {modelStatus === 'ready'
                  ? brainStatus === 'ready'
                    ? '🧠 Full'
                    : routerStatus === 'ready'
                      ? '⚡ Router'
                      : '🧠 Ready'
                  : '⏳ ' + modelStatus}
              </Text>
              {isSwapping && (
                <>
                  <Text style={styles.statusSeparator}>·</Text>
                  <Text style={styles.statusText}>Swapping...</Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.iconButton}
              onPress={handleNewChat}
              accessibilityLabel="New conversation"
            >
              <Ionicons name="create-outline" size={22} color={colors.text.secondary} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push('/history')}
            >
              <Ionicons name="time-outline" size={22} color={colors.text.secondary} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>
        </View>

        {/* ── Chat Area ─────────────────────────────────────────────── */}
        <View style={styles.chatArea}>
          {modelStatus !== 'ready' ? (
            renderModelStatus()
          ) : messages.length === 0 ? (
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
          ) : (
            <FlatList
              ref={flatListRef}
              data={[...messages].reverse()}
              inverted={true}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MessageBubble item={item} />}
              contentContainerStyle={styles.messageList}
            />
          )}
        </View>

        {/* ── Input Bar ─────────────────────────────────────────────── */}
        <View style={styles.inputBar}>
          <View style={styles.inputFieldContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Message Lyla..."
              placeholderTextColor={colors.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isGenerating}
            />
          </View>
          <Pressable
            style={[
              styles.micButton,
              knowledgeActive && styles.knowledgeActive,
              !isOnline && styles.buttonDisabled,
            ]}
            onPress={() => {
              if (!isOnline) return;
              maybeHaptic(() => hapticSelection());
              setKnowledgeActive(!knowledgeActive);
            }}
            disabled={isGenerating}
          >
            <Ionicons
              name="globe-outline"
              size={22}
              color={
                knowledgeActive
                  ? colors.accent.primary
                  : !isOnline
                    ? colors.text.tertiary
                    : colors.text.primary
              }
            />
          </Pressable>
          <Pressable
            style={[styles.sendButton, (!inputText.trim() || isGenerating) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isGenerating}
          >
            <Ionicons name="arrow-up" size={20} color={colors.text.inverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  chatArea: {
    flex: 1,
  },
  messageList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
  },
  messageWrapperAssistant: {
    alignSelf: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  assistantAvatarText: {
    ...typography.label,
    color: colors.text.inverse,
  },
  messageBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
  },
  messageBubbleUser: {
    backgroundColor: colors.accent.primary,
    borderBottomRightRadius: radius.sm,
  },
  messageBubbleAssistant: {
    backgroundColor: colors.background.secondary,
    borderBottomLeftRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  messageTextUser: {
    ...typography.bodyMedium,
    color: colors.text.inverse,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
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
  modelStatusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  downloadPrompt: {
    backgroundColor: colors.background.secondary,
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    width: '100%',
    maxWidth: 340,
  },
  downloadTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  downloadSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  downloadButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  downloadButtonText: {
    ...typography.label,
    color: colors.text.inverse,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  inputFieldContainer: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.xl,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  inputField: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 44,
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
  sendButtonDisabled: {
    backgroundColor: colors.background.tertiary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  knowledgeActive: {
    backgroundColor: colors.accent.primary + '20',
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  feedbackBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  feedbackRow: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
