import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import {
  MessageSquare,
  Send,
  Users,
  MapPin,
  Sparkles,
  ShieldCheck,
  Dumbbell,
  Search,
} from 'lucide-react';

export const MessagesView: React.FC = () => {
  const {
    messages,
    sendMessage,
    currentUser,
    selectedCenter,
    users,
    theme,
  } = useGym();

  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [inputText, setInputText] = useState('');

  const channels = [
    { id: 'general', name: 'General Community', icon: Users, center: 'All' },
    { id: 'ranaghat', name: 'Ranaghat Lifters', icon: Dumbbell, center: 'Ranaghat' },
    { id: 'chakdah', name: 'Chakdah Fitness Hub', icon: Dumbbell, center: 'Chakdah' },
    { id: 'madanpur', name: 'Madanpur Iron Den', icon: Dumbbell, center: 'Madanpur' },
    { id: 'trainers', name: 'Trainers & Coaches', icon: ShieldCheck, center: 'All' },
  ];

  // Filter messages for active channel
  const currentMessages = messages.filter(m => m.channel_id === activeChannelId || (!m.channel_id && activeChannelId === 'general'));
  const activeChannelObj = channels.find(c => c.id === activeChannelId) || channels[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText.trim(), undefined, activeChannelId);
    setInputText('');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Hercules Community Chat</h2>
        <p className="text-xs text-zinc-400">
          Connect with trainers, share PRs, ask nutrition advice, and talk with fellow lifters
        </p>
      </div>

      {/* Main Chat Interface */}
      <div className={`rounded-3xl border overflow-hidden flex flex-col md:flex-row h-[600px] ${
        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        {/* Left Channels List */}
        <div className={`w-full md:w-64 border-b md:border-b-0 md:border-r p-4 flex flex-col shrink-0 ${
          theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-3">
            Gym Channels
          </div>

          <div className="space-y-1 overflow-y-auto flex-1">
            {channels.map(ch => {
              const Icon = ch.icon;
              const isActive = activeChannelId === ch.id;

              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md font-bold'
                      : theme === 'dark'
                      ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                      : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate text-left flex-1">{ch.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Coach Tip Box */}
          <div className="mt-auto p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs hidden md:block">
            <div className="flex items-center gap-1 text-rose-400 font-bold text-[11px] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Coach Tip
            </div>
            <p className="text-[10px] text-zinc-300">
              Need spotter assistance or form correction? Mention @Trainer in chat!
            </p>
          </div>
        </div>

        {/* Right Message Thread & Input */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Channel Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-white">{activeChannelObj.name}</h3>
            </div>

            <span className="text-[11px] text-zinc-400">
              {currentMessages.length} Messages
            </span>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 opacity-40" />
                <p>No messages in #{activeChannelObj.name} yet. Be the first to start the conversation!</p>
              </div>
            ) : (
              currentMessages.map(msg => {
                const isMe = msg.sender_id === currentUser?.id;
                const senderUser = users.find(u => u.id === msg.sender_id);
                const avatar = senderUser?.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={avatar}
                      alt={msg.sender_name}
                      className="w-8 h-8 rounded-xl object-cover shrink-0 ring-1 ring-zinc-800"
                    />

                    <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-white">{msg.sender_name}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                          msg.sender_role === 'admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : msg.sender_role === 'trainer'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {msg.sender_role}
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-rose-600 text-white rounded-tr-none'
                            : theme === 'dark'
                            ? 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none'
                            : 'bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800/80 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Send message to #${activeChannelObj.name}...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white transition-all shadow-md shadow-rose-900/30 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
