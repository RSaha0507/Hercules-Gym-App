import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { CenterType, User } from '../types';
import {
  MessageSquare,
  Send,
  Users,
  MapPin,
  Sparkles,
  ShieldCheck,
  Dumbbell,
  Search,
  UserCheck,
  Lock,
} from 'lucide-react';

export const MessagesView: React.FC = () => {
  const {
    messages,
    sendMessage,
    currentUser,
    users,
    theme,
  } = useGym();

  const [activeChatType, setActiveChatType] = useState<'channel' | 'direct'>('channel');
  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    if (currentUser?.role === 'admin') return 'ranaghat';
    if (currentUser?.center === 'Chakdah') return 'chakdah';
    if (currentUser?.center === 'Madanpur') return 'madanpur';
    return 'ranaghat';
  });
  const [activeDirectUser, setActiveDirectUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchContactQuery, setSearchContactQuery] = useState('');

  const allChannels = [
    { id: 'ranaghat', name: 'Ranaghat Branch', icon: Dumbbell, center: 'Ranaghat' as CenterType },
    { id: 'chakdah', name: 'Chakdah Branch', icon: Dumbbell, center: 'Chakdah' as CenterType },
    { id: 'madanpur', name: 'Madanpur Branch', icon: Dumbbell, center: 'Madanpur' as CenterType },
    { id: 'trainers', name: 'Trainers & Coaches', icon: ShieldCheck, center: 'All' as const },
  ];

  const userRole = currentUser?.role || 'member';
  const userBranch = currentUser?.center || 'Ranaghat';

  // Branch Isolation for Channels
  const accessibleChannels = allChannels.filter(ch => {
    if (userRole === 'admin') return true;
    if (ch.center === 'All') return true;
    return ch.center === userBranch;
  });

  // Branch Isolation for Direct Contacts
  // Members & Trainers can only chat with members/trainers in their branch + all admins
  // Admins can chat with everyone across all branches
  const accessibleContacts = users.filter(u => {
    if (u.id === currentUser?.id) return false;
    if (userRole === 'admin') return true;
    if (u.role === 'admin') return true; // Can always contact Admin
    return u.center === userBranch; // Only their branch
  }).filter(u => {
    if (!searchContactQuery.trim()) return true;
    return u.full_name.toLowerCase().includes(searchContactQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchContactQuery.toLowerCase()) ||
      u.center.toLowerCase().includes(searchContactQuery.toLowerCase());
  });

  // Active Channel / Chat Object
  const currentChannelObj = accessibleChannels.find(c => c.id === activeChannelId) || accessibleChannels[0];

  // Filter messages
  const currentMessages = activeChatType === 'channel'
    ? messages.filter(m => m.channel_id === (currentChannelObj?.id || 'ranaghat'))
    : messages.filter(m => {
        if (!activeDirectUser || !currentUser) return false;
        return (
          (m.sender_id === currentUser.id && m.recipient_id === activeDirectUser.id) ||
          (m.sender_id === activeDirectUser.id && m.recipient_id === currentUser.id)
        );
      });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (activeChatType === 'channel') {
      sendMessage(inputText.trim(), undefined, currentChannelObj?.id);
    } else if (activeDirectUser) {
      sendMessage(inputText.trim(), activeDirectUser.id, undefined);
    }
    setInputText('');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Hercules Community Chat</h2>
          <p className="text-xs text-zinc-400">
            {userRole === 'admin'
              ? 'Multi-branch administrative communications and member support'
              : `Restricted to ${userBranch} Branch members, branch trainers, and administration`}
          </p>
        </div>

        {/* Isolation Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>
              {userRole === 'admin' ? 'Global Admin Access' : `${userBranch} Branch Network`}
            </span>
          </span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className={`rounded-3xl border overflow-hidden flex flex-col md:flex-row h-[620px] ${
        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        {/* Left Sidebar: Channels & Contacts */}
        <div className={`w-full md:w-72 border-b md:border-b-0 md:border-r p-4 flex flex-col shrink-0 ${
          theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          {/* Chat Mode Toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 mb-3">
            <button
              onClick={() => setActiveChatType('channel')}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeChatType === 'channel'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Channels</span>
            </button>
            <button
              onClick={() => {
                setActiveChatType('direct');
                if (!activeDirectUser && accessibleContacts.length > 0) {
                  setActiveDirectUser(accessibleContacts[0]);
                }
              }}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeChatType === 'direct'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Direct DMs</span>
            </button>
          </div>

          {/* Section 1: Channels List */}
          {activeChatType === 'channel' && (
            <div className="space-y-1 overflow-y-auto flex-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-2 px-1">
                {userRole === 'admin' ? 'All Branch Channels' : 'Your Branch Channel'}
              </div>

              {accessibleChannels.map(ch => {
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
          )}

          {/* Section 2: Direct Contacts List */}
          {activeChatType === 'direct' && (
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search branch members..."
                  value={searchContactQuery}
                  onChange={e => setSearchContactQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                {accessibleContacts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    No contacts found in {userBranch} Branch.
                  </div>
                ) : (
                  accessibleContacts.map(contact => {
                    const isSelected = activeDirectUser?.id === contact.id;
                    const avatar = contact.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';

                    return (
                      <button
                        key={contact.id}
                        onClick={() => setActiveDirectUser(contact)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs transition-all text-left ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-md font-bold'
                            : theme === 'dark'
                            ? 'text-zinc-300 hover:bg-zinc-900'
                            : 'text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        <img
                          src={avatar}
                          alt={contact.full_name}
                          className="w-7 h-7 rounded-xl object-cover shrink-0 ring-1 ring-zinc-700"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-semibold text-xs">{contact.full_name}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-rose-200' : 'text-zinc-400'}`}>
                            {contact.center} • {contact.role.toUpperCase()}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Branch Isolation Info Box */}
          <div className="mt-auto p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs hidden md:block">
            <div className="flex items-center gap-1 text-rose-400 font-bold text-[11px] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Branch Security
            </div>
            <p className="text-[10px] text-zinc-300 leading-snug">
              {userRole === 'admin'
                ? 'Admins have omni-channel access across all 3 gym centers.'
                : `Conversations are locked to members and trainers of ${userBranch} Branch.`}
            </p>
          </div>
        </div>

        {/* Right Chat Thread & Input */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {activeChatType === 'channel' ? (
                <>
                  <MessageSquare className="w-5 h-5 text-rose-500" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{currentChannelObj?.name}</h3>
                    <p className="text-[10px] text-zinc-400">
                      {currentChannelObj?.center === 'All' ? 'All Branch Members' : `${currentChannelObj?.center} Branch Channel`}
                    </p>
                  </div>
                </>
              ) : activeDirectUser ? (
                <>
                  <img
                    src={activeDirectUser.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
                    alt={activeDirectUser.full_name}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-zinc-700"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{activeDirectUser.full_name}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[9px] font-black uppercase text-zinc-300">
                        {activeDirectUser.role}
                      </span>
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      {activeDirectUser.center} Branch
                    </p>
                  </div>
                </>
              ) : (
                <span className="text-xs text-zinc-400">Select a contact</span>
              )}
            </div>

            <span className="text-[11px] text-zinc-400">
              {currentMessages.length} Messages
            </span>
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 opacity-40" />
                <p>
                  {activeChatType === 'channel'
                    ? `No messages in #${currentChannelObj?.name} yet.`
                    : `No direct messages with ${activeDirectUser?.full_name || 'this member'} yet.`}
                </p>
                <p className="text-[11px] text-zinc-600">Start the conversation below!</p>
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

          {/* Chat Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800/80 flex items-center gap-2">
            <input
              type="text"
              placeholder={
                activeChatType === 'channel'
                  ? `Message #${currentChannelObj?.name}...`
                  : `Message @${activeDirectUser?.full_name || 'member'}...`
              }
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
