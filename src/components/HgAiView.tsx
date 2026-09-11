import React, { useState, useRef, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { HGAiMessage } from '../types';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Dumbbell,
  Salad,
  Flame,
  Coffee,
  HeartPulse,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface PromptCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  prompt: string;
}

const STARTER_PROMPTS: PromptCard[] = [
  {
    icon: Dumbbell,
    title: 'Push-Pull-Legs Split',
    subtitle: 'Hypertrophy program with sets, reps & progression',
    prompt: 'Provide a structured 3-day Push-Pull-Legs gym workout split with exercise selection, target muscle groups, sets, reps, and warm-up.',
  },
  {
    icon: Salad,
    title: 'High-Protein Veg Diet',
    subtitle: 'Daily meal timings, macros & calorie breakdown',
    prompt: 'Please design a high-protein vegetarian diet plan with meal timings, calorie estimates, daily protein/carb/fat targets, and grocery ideas.',
  },
  {
    icon: HeartPulse,
    title: '15-Min Morning Yoga',
    subtitle: 'Spine mobility, hip flexor release & breathwork',
    prompt: 'Guide me through a 15-minute morning yoga flow for spine mobility, hip flexibility, posture correction, and deep breathwork.',
  },
  {
    icon: Flame,
    title: 'Fat Loss & Deficit Guide',
    subtitle: 'Preserve lean muscle while dropping body fat',
    prompt: 'How do I calculate a healthy caloric deficit for fat loss while preserving lean muscle mass? Give exact calculation guidelines and habits.',
  },
  {
    icon: Coffee,
    title: 'Pre & Post Workout Fuel',
    subtitle: 'Optimal timing for muscle glycogen & protein synthesis',
    prompt: 'What are optimal pre-workout and post-workout meal options for muscle glycogen recovery, energy, and rapid protein synthesis?',
  },
];

// Simple markdown formatter for messages
function renderMarkdownContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1 pl-5 list-disc text-sm">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const parseInline = (text: string) => {
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-zinc-800 text-rose-300 font-mono text-xs">$1</code>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      continue;
    }

    // Heading
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={i} className="text-base font-bold text-zinc-100 mt-3 mb-1.5 flex items-center gap-1.5">
          {line.replace('### ', '')}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-lg font-extrabold text-white mt-4 mb-2">
          {line.replace('## ', '')}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-xl font-black text-white mt-4 mb-2">
          {line.replace('# ', '')}
        </h2>
      );
      continue;
    }

    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      inList = true;
      listItems.push(line.replace(/^[-*•]\s+/, ''));
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      flushList();
      elements.push(
        <div key={i} className="flex gap-2 text-sm my-1">
          <span className="font-bold text-rose-500 shrink-0">{numMatch[1]}.</span>
          <span dangerouslySetInnerHTML={{ __html: parseInline(numMatch[2]) }} />
        </div>
      );
      continue;
    }

    flushList();

    // Regular paragraph
    elements.push(
      <p
        key={i}
        className="text-sm leading-relaxed my-1.5"
        dangerouslySetInnerHTML={{ __html: parseInline(line) }}
      />
    );
  }

  flushList();
  return elements;
}

export const HgAiView: React.FC = () => {
  const { currentUser, theme, chatWithAi } = useGym();
  const [messages, setMessages] = useState<HGAiMessage[]>(() => {
    try {
      const saved = localStorage.getItem('hg_ai_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('hg_ai_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save AI messages', e);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isGenerating) return;

    const userMessage: HGAiMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsGenerating(true);

    try {
      const replyText = await chatWithAi(
        newHistory.map((m) => ({ role: m.role, content: m.content })),
        {
          member_name: currentUser?.full_name,
          branch: currentUser?.center,
        }
      );

      const botMessage: HGAiMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errMsg: HGAiMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **HG.AI Notice**: ${
          err?.message || 'Unable to connect to AI Coach. Please make sure the backend is reachable.'
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    if (window.confirm('Clear your conversation history with HG.AI?')) {
      setMessages([]);
      localStorage.removeItem('hg_ai_messages');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border mb-4 flex items-center justify-between shadow-sm transition-colors ${
          theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src="/hg-ai-logo.png"
              alt="HG.AI Logo"
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/40"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                HG.AI Personal Coach
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Live
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Certified Strength & Nutrition Intelligence for Hercules Gym members & staff
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2 rounded-xl border border-zinc-700/60 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div
        className={`flex-1 overflow-y-auto p-4 sm:p-6 rounded-2xl border mb-4 space-y-4 shadow-inner ${
          theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'
        }`}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center max-w-2xl mx-auto py-8">
            <div className="w-16 h-16 rounded-3xl p-1 bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-4 shadow-xl">
              <img src="/hg-ai-logo.png" alt="HG.AI" className="w-12 h-12 rounded-2xl object-cover" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              How can HG.AI assist your workout & diet today?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-md">
              Ask anything about progressive overload, custom meal plans, macros, technique tips,
              or injury prevention tailored to Hercules Gym equipment.
            </p>

            {/* Quick Starter Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-6 text-left">
              {STARTER_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className={`p-3.5 rounded-xl border text-left transition-all hover:scale-[1.02] group ${
                      theme === 'dark'
                        ? 'bg-zinc-900/70 border-zinc-800 hover:border-rose-500/50 hover:bg-zinc-900'
                        : 'bg-white border-zinc-200 hover:border-rose-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1 text-rose-500">
                      <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-zinc-100 group-hover:text-rose-400">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2">{item.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 ring-1 ring-rose-500/40 shadow-md">
                    <img src="/hg-ai-logo.png" alt="HG.AI" className="w-full h-full object-cover" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl relative group ${
                    isUser
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/30'
                      : theme === 'dark'
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                      : 'bg-white border border-zinc-200 text-zinc-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {isUser ? currentUser?.full_name || 'You' : 'HG.AI Specialist'}
                    </span>
                    <span className="text-[10px] opacity-60">{m.timestamp}</span>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      renderMarkdownContent(m.content)
                    )}
                  </div>

                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isGenerating && (
          <div className="flex gap-3 max-w-xl mr-auto items-center text-zinc-400 text-xs font-semibold">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
              <span>HG.AI is analyzing and generating your fitness plan...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className={`p-2.5 sm:p-3 rounded-2xl border flex items-center gap-2.5 shadow-lg ${
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask HG.AI about workouts, diet splits, macros, or recovery..."
          disabled={isGenerating}
          className={`flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder-zinc-500 ${
            theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
          }`}
        />

        <button
          type="submit"
          disabled={!input.trim() || isGenerating}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-900/30"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
