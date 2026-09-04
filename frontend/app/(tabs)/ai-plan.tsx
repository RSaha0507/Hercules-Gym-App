import React, { useState, useRef, useEffect, Component, ReactNode } from 'react';
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
  Keyboard,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { exportPlanToPdf } from '../../src/utils/pdfGenerator';

// Enable LayoutAnimation safely for Android
try {
  if (Platform.OS === 'android' && typeof (UIManager as any)?.setLayoutAnimationEnabledExperimental === 'function') {
    (UIManager as any).setLayoutAnimationEnabledExperimental(true);
  }
} catch (e) {
  // Ignore animation setup errors
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
    icon: 'restaurant-outline',
    title: 'Pre & Post Workout Fuel',
    subtitle: 'Optimal timing for muscle glycogen & protein synthesis',
    prompt: 'What are optimal pre-workout and post-workout meal options for muscle glycogen recovery, energy, and rapid protein synthesis?',
  },
];

/* =========================================================================
   INLINE SELF-CONTAINED MARKDOWN RENDERER
   Supports tables, headings, bold, italics, lists & paragraphs.
   Zero external dependencies.
   ========================================================================= */

function renderInlineFormatting(text: string, baseStyle: TextStyle, isUser: boolean, theme: any) {
  if (!text) return null;
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold + Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <Text key={index} style={[baseStyle, { fontWeight: '700', fontStyle: 'italic', color: isUser ? '#FFF' : theme.text }]}>
          {part.slice(3, -3)}
        </Text>
      );
    }
    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <Text key={index} style={[baseStyle, { fontWeight: '700', color: isUser ? '#FFF' : (theme.primaryDark || theme.text) }]}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    // Italic: *text* or _text_
    if (((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) && part.length >= 2) {
      return (
        <Text key={index} style={[baseStyle, { fontStyle: 'italic', opacity: 0.9 }]}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    // Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <Text
          key={index}
          style={[
            baseStyle,
            {
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              fontSize: (baseStyle.fontSize || 14) * 0.9,
              backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : theme.inputBg,
              color: isUser ? '#FFF' : theme.primary,
              paddingHorizontal: 4,
            },
          ]}
        >
          {part.slice(1, -1)}
        </Text>
      );
    }

    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
}

function parseMarkdownBlocks(rawMd: string) {
  if (!rawMd || typeof rawMd !== 'string') return [];
  const lines = rawMd.split('\n');
  const blocks: Array<{
    type: 'heading' | 'divider' | 'blockquote' | 'bullet_list' | 'numbered_list' | 'table' | 'paragraph';
    level?: number;
    text?: string;
    items?: any[];
    headers?: string[];
    rows?: string[][];
  }> = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Divider: ---
    if (/^(---|---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // Heading: #, ##, ###
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      let text = headingMatch[2].trim();
      if (text.startsWith('**') && text.endsWith('**') && text.length >= 4) {
        text = text.slice(2, -2).trim();
      }
      blocks.push({ type: 'heading', level, text });
      i++;
      continue;
    }

    // Blockquote: >
    if (line.startsWith('>')) {
      blocks.push({ type: 'blockquote', text: line.replace(/^>\s*/, '').trim() });
      i++;
      continue;
    }

    // Table: line with | and separator on next line
    if (line.includes('|') && i + 1 < lines.length && /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(lines[i + 1].trim())) {
      const cleanRow = (r: string) => {
        let t = r.trim();
        if (t.startsWith('|')) t = t.slice(1);
        if (t.endsWith('|')) t = t.slice(0, -1);
        return t.split('|').map((c) => c.trim());
      };
      const headers = cleanRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|') && !/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(lines[i].trim())) {
        const row = cleanRow(lines[i]);
        if (row.some((c) => c.length > 0)) rows.push(row);
        i++;
      }
      if (headers.length > 0) {
        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }

    // Bullet List: * or -
    const bulletMatch = line.match(/^(\*|-|\+|•)\s+(.*)$/);
    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const curr = lines[i].trim();
        const m = curr.match(/^(\*|-|\+|•)\s+(.*)$/);
        if (m) {
          items.push(m[2].trim());
          i++;
        } else if (curr && !curr.startsWith('#') && !curr.includes('|')) {
          if (items.length > 0) items[items.length - 1] += ' ' + curr;
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'bullet_list', items });
      continue;
    }

    // Numbered List: 1.
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const items: { num: string; text: string }[] = [];
      while (i < lines.length) {
        const curr = lines[i].trim();
        const m = curr.match(/^(\d+)\.\s+(.*)$/);
        if (m) {
          items.push({ num: m[1], text: m[2].trim() });
          i++;
        } else if (curr && !curr.startsWith('#') && !curr.includes('|')) {
          if (items.length > 0) items[items.length - 1].text += ' ' + curr;
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'numbered_list', items });
      continue;
    }

    // Regular Paragraph
    let paraText = line;
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().match(/^(#{1,6}\s+|(\*|-|\+|•)\s+|\d+\.\s+|>|---|___|\*\*\*)/) &&
      !lines[i].trim().includes('|')
    ) {
      paraText += ' ' + lines[i].trim();
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraText });
  }

  return blocks;
}

const SafeMarkdown: React.FC<{ content: string; isUser: boolean; theme: any }> = ({ content, isUser, theme }) => {
  const blocks = React.useMemo(() => parseMarkdownBlocks(content), [content]);
  const baseTextStyle: TextStyle = {
    fontSize: 14.5,
    lineHeight: 22,
    color: isUser ? '#FFFFFF' : theme.text,
  };

  return (
    <View style={{ width: '100%' }}>
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          const fontSize = block.level === 1 ? 19 : block.level === 2 ? 17 : 15.5;
          const headingStyle: TextStyle = {
            fontSize,
            fontWeight: '700',
            lineHeight: fontSize * 1.35,
            color: isUser ? '#FFFFFF' : theme.text,
            marginTop: idx === 0 ? 2 : 12,
            marginBottom: 4,
          };
          return (
            <Text key={idx} style={headingStyle}>
              {renderInlineFormatting(block.text || '', headingStyle, isUser, theme)}
            </Text>
          );
        }

        if (block.type === 'divider') {
          return (
            <View
              key={idx}
              style={{
                height: 1,
                backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : theme.border,
                marginVertical: 10,
              }}
            />
          );
        }

        if (block.type === 'blockquote') {
          return (
            <View
              key={idx}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: theme.primary,
                backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : theme.inputBg,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 4,
                marginVertical: 6,
              }}
            >
              <Text style={[baseTextStyle, { fontStyle: 'italic' }]}>
                {renderInlineFormatting(block.text || '', baseTextStyle, isUser, theme)}
              </Text>
            </View>
          );
        }

        if (block.type === 'bullet_list') {
          return (
            <View key={idx} style={{ marginVertical: 4 }}>
              {(block.items || []).map((item, itemIdx) => (
                <View key={itemIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 }}>
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: isUser ? '#FFF' : theme.primary,
                      marginTop: 8,
                      marginRight: 8,
                    }}
                  />
                  <Text style={[baseTextStyle, { flex: 1 }]}>
                    {renderInlineFormatting(item, baseTextStyle, isUser, theme)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'numbered_list') {
          return (
            <View key={idx} style={{ marginVertical: 4 }}>
              {(block.items || []).map((item, itemIdx) => (
                <View key={itemIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 }}>
                  <Text style={{ fontWeight: '700', fontSize: 13.5, marginRight: 6, lineHeight: 22, color: isUser ? '#FFF' : theme.primary }}>
                    {item.num}.
                  </Text>
                  <Text style={[baseTextStyle, { flex: 1 }]}>
                    {renderInlineFormatting(item.text, baseTextStyle, isUser, theme)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'table') {
          const headers = block.headers || [];
          const rows = block.rows || [];
          const colWidths = headers.map((_, cIdx) => {
            const maxL = Math.max(headers[cIdx]?.length || 0, ...rows.map((r) => (r[cIdx] || '').length));
            if (maxL <= 10) return 90;
            if (maxL <= 22) return 130;
            return 170;
          });

          return (
            <View key={idx} style={{ marginVertical: 8, width: '100%' }}>
              <Text style={{ fontSize: 10, color: isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary, marginBottom: 3 }}>
                ↔ Swipe table horizontally
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled={true}>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: isUser ? 'rgba(255,255,255,0.25)' : theme.border,
                    borderRadius: 6,
                    overflow: 'hidden',
                    backgroundColor: isUser ? 'transparent' : theme.card,
                  }}
                >
                  {/* Table Header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : (theme.isDark ? '#262626' : '#f1f5f9'),
                      borderBottomWidth: 1,
                      borderBottomColor: isUser ? 'rgba(255,255,255,0.25)' : theme.border,
                    }}
                  >
                    {headers.map((h, hIdx) => (
                      <View
                        key={hIdx}
                        style={{
                          width: colWidths[hIdx],
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRightWidth: hIdx === headers.length - 1 ? 0 : StyleSheet.hairlineWidth,
                          borderRightColor: isUser ? 'rgba(255,255,255,0.25)' : theme.border,
                        }}
                      >
                        <Text style={{ fontWeight: '700', fontSize: 12, color: isUser ? '#FFF' : theme.text }}>
                          {renderInlineFormatting(h, { fontSize: 12, fontWeight: '700' }, isUser, theme)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {/* Table Rows */}
                  {rows.map((row, rIdx) => (
                    <View
                      key={rIdx}
                      style={{
                        flexDirection: 'row',
                        backgroundColor: rIdx % 2 === 1 ? (isUser ? 'rgba(255,255,255,0.06)' : theme.inputBg) : 'transparent',
                        borderBottomWidth: rIdx === rows.length - 1 ? 0 : StyleSheet.hairlineWidth,
                        borderBottomColor: isUser ? 'rgba(255,255,255,0.25)' : theme.border,
                      }}
                    >
                      {headers.map((_, cIdx) => (
                        <View
                          key={cIdx}
                          style={{
                            width: colWidths[cIdx],
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            borderRightWidth: cIdx === headers.length - 1 ? 0 : StyleSheet.hairlineWidth,
                            borderRightColor: isUser ? 'rgba(255,255,255,0.25)' : theme.border,
                          }}
                        >
                          <Text style={{ fontSize: 12.5, lineHeight: 18, color: isUser ? '#FFF' : theme.text }}>
                            {renderInlineFormatting(row[cIdx] || '', { fontSize: 12.5 }, isUser, theme)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          );
        }

        // Paragraph
        return (
          <View key={idx} style={{ marginBottom: 6 }}>
            <Text style={baseTextStyle}>
              {renderInlineFormatting(block.text || '', baseTextStyle, isUser, theme)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

/* =========================================================================
   ERROR BOUNDARY
   Guarantees that HG.AI never goes blank if any unexpected render error happens
   ========================================================================= */

class ScreenErrorBoundary extends Component<
  { children: ReactNode; theme: any },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('HG.AI Screen Caught Exception:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: this.props.theme?.background || '#0f172a',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Ionicons name="alert-circle-outline" size={54} color="#ef4444" />
          <Text
            style={{
              color: this.props.theme?.text || '#ffffff',
              fontSize: 18,
              fontWeight: '800',
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            HG.AI Temporary Notice
          </Text>
          <Text
            style={{
              color: this.props.theme?.textSecondary || '#94a3b8',
              fontSize: 13,
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 20,
              backgroundColor: this.props.theme?.primary || '#2563eb',
              paddingHorizontal: 22,
              paddingVertical: 11,
              borderRadius: 8,
            }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>Reload HG.AI</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

/* =========================================================================
   MAIN HG.AI SCREEN COMPONENT
   ========================================================================= */

function HGAIScreenInner() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const floatingTabBarHeight = 86 + insets.bottom;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSub?.remove?.();
      hideSub?.remove?.();
    };
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const isChatting = messages.length > 0;

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isGenerating) return;

    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {}

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
      console.log('HG.AI request error:', err);
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
    } catch (err: any) {
      console.log('PDF export error:', err);
      Alert.alert('Export Notice', 'Unable to generate PDF document at this moment.');
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
          try {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          } catch (e) {}
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
          /* Opening Welcome Screen */
          <ScrollView
            style={styles.centerContainer}
            contentContainerStyle={styles.centerContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Center Logo */}
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

            <Text style={[styles.centerTitle, { color: theme.text }]}>HG.AI</Text>
            <Text style={[styles.centerSubtitle, { color: theme.primary }]}>
              Hercules Gym Intelligent Coach
            </Text>
            <Text style={[styles.centerDescription, { color: theme.textSecondary }]}>
              What fitness goal, lifting form, yoga flow, or nutrition plan would you like to master today?
            </Text>

            {/* Starter Prompt Cards */}
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
          /* Active Chat Stream */
          <>
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
                      <SafeMarkdown content={msg.content} isUser={isUser} theme={theme} />

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
                        HG.AI is consulting sports science &amp; fitness guidelines...
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </>
        )}

        {/* Input Bar */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              paddingBottom: isKeyboardVisible
                ? (Platform.OS === 'ios' ? 10 : 8)
                : floatingTabBarHeight + 8,
            },
          ]}
        >
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
            Strictly specialized in workouts, exercises, yoga, meditation, diet &amp; healthy lifestyle.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function HGAIScreen() {
  const { theme } = useTheme();
  return (
    <ScreenErrorBoundary theme={theme}>
      <HGAIScreenInner />
    </ScreenErrorBoundary>
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
    color: '#FFF',
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
    backgroundColor: '#000',
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
    backgroundColor: '#000',
  },
  botAvatarImage: {
    width: '100%',
    height: '100%',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    maxWidth: '82%',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    maxWidth: '88%',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
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
