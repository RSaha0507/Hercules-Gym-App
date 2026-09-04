import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { exportPlanToPdf } from '../../src/utils/pdfGenerator';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HG_AI_LOGO = require('../../assets/images/hg-ai-logo.png');

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface PromptCard {
  icon: string;
  title: string;
  subtitle: string;
  prompt: string;
}

const STARTER_PROMPTS: PromptCard[] = [
  {
    icon: 'barbell-outline',
    title: 'Push-Pull-Legs Split',
    subtitle: 'Hypertrophy program with sets, reps & progression',
    prompt: 'Provide a structured 3-day Push-Pull-Legs gym workout split with exercise selection, target muscle groups, sets, reps, and warm-up.',
  },
  {
    icon: 'nutrition-outline',
    title: 'High-Protein Veg Diet',
    subtitle: 'Daily meal timings, macros & calorie breakdown',
    prompt: 'Please design a high-protein vegetarian diet plan with meal timings, calorie estimates, daily protein/carb/fat targets, and grocery ideas.',
  },
  {
    icon: 'fitness-outline',
    title: '15-Min Morning Yoga',
    subtitle: 'Spine mobility, hip flexor release & breathwork',
    prompt: 'Guide me through a 15-minute morning yoga flow for spine mobility, hip flexibility, posture correction, and deep breathwork.',
  },
  {
    icon: 'flame-outline',
    title: 'Fat Loss & Deficit Guide',
    subtitle: 'Preserve lean muscle while dropping body fat',
    prompt: 'How do I calculate a healthy caloric deficit for fat loss while preserving lean muscle mass? Give exact calculation guidelines and habits.',
  },
  {
    icon: 'moon-outline',
    title: 'Recovery & Sleep Protocol',
    subtitle: 'Reduce DOMS soreness & maximize deep sleep',
    prompt: 'What are the best recovery habits, foam rolling techniques, and sleep hygiene practices to optimize deep muscle recovery after heavy training?',
  },
  {
    icon: 'restaurant-outline',
    title: 'Pre & Post Workout Fuel',
    subtitle: 'Optimal timing for muscle glycogen & protein synthesis',
    prompt: 'What are optimal pre-workout and post-workout meal options for muscle glycogen recovery, energy, and rapid protein synthesis?',
  },
];

export default function HGAIScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Chat conversation state - starts empty like ChatGPT/Gemini
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const isChatting = messages.length > 0;

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isGenerating) return;

    // Smoothly animate logo moving from center to top-right corner
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    setIsGenerating(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const payloadMessages = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.chatWithAI(payloadMessages, {
        member_name: user?.full_name,
        branch: user?.center,
      });

      const replyText = res?.response || 'I am ready to help you with your fitness and health goals.';
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (err: any) {
      console.log('HG.AI error:', err);
      const detail = err.response?.data?.detail;
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout');
      const errText = detail || (isTimeout
        ? 'HG.AI request timed out. Please tap to try again.'
        : 'Unable to reach HG.AI service. Please check connection.');

      const errorBotMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **HG.AI Notice**: ${errText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorBotMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPdf = async (msg: ChatMessage) => {
    setExportingId(msg.id);
    try {
      const firstLine = msg.content.split('\n')[0].replace(/[*#]/g, '').trim();
      const title = firstLine.length > 5 && firstLine.length < 50 ? firstLine : 'Hercules Gym Fitness & Diet Plan';
      await exportPlanToPdf(title, msg.content, `Prepared by HG.AI for ${user?.full_name || 'Member'}`);
    } finally {
      setExportingId(null);
    }
  };

  const resetChat = () => {
    if (messages.length === 0) return;
    Alert.alert('New Chat', 'Start a fresh conversation with HG.AI?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start Fresh',
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setMessages([]);
          setInputText('');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Bar */}
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <View>
              <View style={styles.titleRow}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>HG.AI</Text>
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeText}>COACH</Text>
                </View>
              </View>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Hercules Gym AI Assistant
              </Text>
            </View>
          </View>

          {/* Top Right Section */}
          <View style={styles.headerRight}>
            {isChatting && (
              <TouchableOpacity
                style={[styles.newChatBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                onPress={resetChat}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={16} color={theme.text} />
                <Text style={[styles.newChatBtnText, { color: theme.text }]}>New Chat</Text>
              </TouchableOpacity>
            )}

            {/* When user starts chatting, the HG.AI logo goes to the top right corner */}
            {isChatting && (
              <View style={styles.topRightLogoWrapper}>
                <Image
                  source={HG_AI_LOGO}
                  style={styles.topRightLogo}
                  resizeMode="cover"
                />
                <View style={styles.onlineDot} />
              </View>
            )}
          </View>
        </View>

        {/* MAIN BODY AREA */}
        {!isChatting ? (
          /* =========================================================================
             GEMINI / CHATGPT OPENING STATE:
             The HG.AI logo opens right in the middle of the screen!
             ========================================================================= */
          <ScrollView
            style={styles.centerContainer}
            contentContainerStyle={styles.centerContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Centered HG.AI Logo with sleek glow aura */}
            <View style={styles.middleLogoOuter}>
              <View style={[styles.middleLogoGlow, { shadowColor: theme.primary }]} />
              <View style={[styles.middleLogoContainer, { borderColor: theme.primary }]}>
                <Image
                  source={HG_AI_LOGO}
                  style={styles.middleLogoImage}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Center Greeting & Title */}
            <Text style={[styles.centerTitle, { color: theme.text }]}>HG.AI</Text>
            <Text style={[styles.centerSubtitle, { color: theme.primary }]}>
              Hercules Gym Intelligent Coach
            </Text>
            <Text style={[styles.centerDescription, { color: theme.textSecondary }]}>
              What fitness goal, lifting form, yoga flow, or nutrition plan would you like to master today?
            </Text>

            {/* Starter Prompt Cards (ChatGPT / Gemini Grid Style) */}
            <View style={styles.starterGrid}>
              {STARTER_PROMPTS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.starterCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => sendMessage(item.prompt)}
                  activeOpacity={0.75}
                  disabled={isGenerating}
                >
                  <View style={[styles.starterIconBox, { backgroundColor: theme.primary + '18' }]}>
                    <Ionicons name={item.icon as any} size={18} color={theme.primary} />
                  </View>
                  <View style={styles.starterTextBox}>
                    <Text style={[styles.starterCardTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.starterCardSubtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-outline" size={14} color={theme.textSecondary} style={styles.starterArrow} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          /* =========================================================================
             ACTIVE CHAT CONVERSATION STATE:
             Logo has moved to top right corner. Messages render here.
             ========================================================================= */
          <>
            {/* Quick Inspiration Horizontal Scrollbar */}
            <View style={[styles.quickChipsBar, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsScroll}
              >
                {STARTER_PROMPTS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.quickChip, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => sendMessage(item.prompt)}
                    disabled={isGenerating}
                  >
                    <Ionicons name={item.icon as any} size={13} color={theme.primary} style={{ marginRight: 5 }} />
                    <Text style={[styles.quickChipText, { color: theme.text }]}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Message Stream */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messageList}
              contentContainerStyle={styles.messageContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isExporting = exportingId === msg.id;

                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      isUser ? styles.userRow : styles.botRow,
                    ]}
                  >
                    {!isUser && (
                      <View style={[styles.botAvatarContainer, { borderColor: theme.primary }]}>
                        <Image
                          source={HG_AI_LOGO}
                          style={styles.botAvatarImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    <View
                      style={[
                        styles.bubble,
                        isUser
                          ? [styles.userBubble, { backgroundColor: theme.primary }]
                          : [styles.botBubble, { backgroundColor: theme.card, borderColor: theme.border }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          { color: isUser ? '#FFFFFF' : theme.text },
                        ]}
                      >
                        {msg.content}
                      </Text>

                      <View style={styles.bubbleFooter}>
                        <Text
                          style={[
                            styles.timestamp,
                            { color: isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
                          ]}
                        >
                          {msg.timestamp}
                        </Text>

                        {!isUser && msg.content.length > 50 && (
                          <TouchableOpacity
                            style={[styles.pdfButton, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                            onPress={() => handleExportPdf(msg)}
                            disabled={isExporting}
                          >
                            {isExporting ? (
                              <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                              <>
                                <Ionicons name="document-text-outline" size={14} color={theme.primary} />
                                <Text style={[styles.pdfButtonText, { color: theme.primary }]}>
                                  Export PDF
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}

              {isGenerating && (
                <View style={[styles.messageRow, styles.botRow]}>
                  <View style={[styles.botAvatarContainer, { borderColor: theme.primary }]}>
                    <Image
                      source={HG_AI_LOGO}
                      style={styles.botAvatarImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={[styles.bubble, styles.botBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.typingRow}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text style={[styles.typingText, { color: theme.textSecondary }]}>
                        HG.AI is consulting sports science & fitness guidelines...
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </>
        )}

        {/* Input Bar (Always Available At Bottom) */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Ask HG.AI about workouts, diet, yoga, recovery..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isGenerating}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputText.trim() && !isGenerating ? theme.primary : theme.border,
                },
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isGenerating}
            >
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
            Strictly specialized in workouts, exercises, yoga, meditation, diet & healthy lifestyle.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#f0cccc',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  newChatBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  topRightLogoWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e11d48',
    overflow: 'visible',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  topRightLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#000',
  },

  // Gemini / ChatGPT Center Opening View Styles
  centerContainer: {
    flex: 1,
  },
  centerContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
    alignItems: 'center',
  },
  middleLogoOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  middleLogoGlow: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 10,
  },
  middleLogoContainer: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 2.5,
    overflow: 'hidden',
    backgroundColor: '#271f1f',
  },
  middleLogoImage: {
    width: '100%',
    height: '100%',
  },
  centerTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  centerSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  centerDescription: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginTop: 8,
    marginBottom: 26,
  },
  starterGrid: {
    width: '100%',
    gap: 10,
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  starterIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  starterTextBox: {
    flex: 1,
  },
  starterCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  starterCardSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  starterArrow: {
    marginLeft: 8,
    opacity: 0.6,
  },

  // Active Chat Message Styles
  quickChipsBar: {
    borderBottomWidth: 1,
    paddingVertical: 7,
  },
  quickChipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: 4,
    backgroundColor: '#1e1919',
  },
  botAvatarImage: {
    width: '100%',
    height: '100%',
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  timestamp: {
    fontSize: 11,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  pdfButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 12.5,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 14,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 6,
  },
});
