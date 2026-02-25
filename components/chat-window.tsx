"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Send, Smile, Trash2, Users, MoreVertical, Phone, X, Check, CheckCheck, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { format, isToday, isThisYear } from "date-fns";

export function ChatWindow({ conversationId }: { conversationId: any }) {
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMembers, setShowMembers] = useState(false);

  const toggleReaction = useMutation(api.messages.toggleReaction);
  const COMMON_EMOJIS = ["❤️", "👍", "🔥", "😂", "😮"];
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);

  // Queries
  const groupMembers = useQuery(api.conversations.getConversationMembers, { conversationId });
  const messages = useQuery(api.messages.list, { conversationId });
  const currentUser = useQuery(api.users.getMe);
  const typers = useQuery(api.conversations.getTypingIndicators, { conversationId });
  const conversation = useQuery(api.conversations.getConversationWithDetails, { conversationId });
  
  // Mutations
  const markAsRead = useMutation(api.conversations.markAsRead);
  const sendMessage = useMutation(api.messages.send);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setTyping = useMutation(api.conversations.setTyping);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    if (conversationId) {
      markAsRead({ conversationId });
    }
  }, [messages?.length, conversationId, markAsRead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageText(val);
    setTyping({ conversationId, isTyping: val.length > 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    await sendMessage({ body: messageText, conversationId });
    setMessageText("");
    setTyping({ conversationId, isTyping: false });
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    if (isToday(date)) return format(date, "h:mm a");
    if (isThisYear(date)) return format(date, "MMM d, h:mm a");
    return format(date, "MMM d, yyyy, h:mm a");
  };

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-[#020617] overflow-hidden border-l border-slate-200/50 dark:border-white/5">
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        
        {/* Header */}
        <div className="h-[72px] px-6 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-white/20">
              {conversation?.isGroup ? (
                <Users className="h-5 w-5 text-purple-500" />
              ) : (
                <img src={(conversation as any)?.image} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {conversation?.name || "Loading..."}
              </h2>
              <div className="flex items-center gap-1.5">
                {conversation?.isGroup ? (
                  <p className="text-[10px] text-slate-500 font-medium">
                    {groupMembers?.length || 0} members
                  </p>
                ) : (
                  <>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      conversation?.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`} />
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${
                      conversation?.isOnline ? "text-emerald-500" : "text-slate-400"
                    }`}>
                      {conversation?.isOnline ? "Online" : "Offline"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <button onClick={() => setShowMembers(!showMembers)} className={`p-2 rounded-xl transition-all ${showMembers ? "bg-purple-600 text-white" : "hover:bg-slate-100 dark:hover:bg-white/5"}`}>
              <Users className="h-5 w-5" />
            </button>
            <Phone className="h-5 w-5 cursor-pointer hover:text-purple-500" />
            <MoreVertical className="h-5 w-5 cursor-pointer hover:text-purple-500" />
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-transparent relative custom-scrollbar">
          {messages?.map((msg) => {
            const isMe = msg.senderId === currentUser?._id;
            const showSenderInfo = conversation?.isGroup && !isMe;

            return (
              <div
  key={msg._id}
  className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-300`}
>
  {/* LEFT SIDE (others only) */}
  {!isMe && (
    <div className="w-8 flex-shrink-0">
      {showSenderInfo ? (
        <img
          src={msg.senderImage || "/default-avatar.png"}
          className="w-8 h-8 rounded-full object-cover border border-white/10"
        />
      ) : (
        <div className="w-8" />  // keeps alignment when avatar hidden
      )}
    </div>
  )}

  {/* MESSAGE BLOCK */}
  <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
    
    {/* SENDER NAME (groups only) */}
    {!isMe && showSenderInfo && (
      <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">
        {msg.senderName}
      </span>
    )}

    {/* BUBBLE + ACTIONS */}
    <div className="relative group/msg">
      {/* hover actions same as yours */}

      <div
        className={`px-4 py-2.5 rounded-2xl shadow-sm ${
          isMe
            ? "bg-purple-600 text-white rounded-tr-none"
            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-white/5"
        }`}
      >
        {msg.deleted ? (
          <p className="text-sm italic opacity-60">🚫 This message was deleted</p>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.body}
          </p>
        )}

        <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
          <p className="text-[9px] font-medium">
            {formatTimestamp(msg._creationTime)}
          </p>
          {isMe && (msg.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  </div>
</div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 shrink-0 p-4">
          <div className="h-5 mb-1 px-2">
            {typers && typers.length > 0 && (
              <p className="text-[10px] text-purple-500 font-medium italic animate-pulse">
                {typers.join(", ")} {typers.length > 1 ? "are" : "is"} typing...
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 items-center max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <input
                value={messageText}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
              />
              <button type="button" className="absolute right-3 top-2.5 text-slate-400 hover:text-purple-500">
                <Smile className="h-5 w-5" />
              </button>
            </div>
            <button type="submit" disabled={!messageText.trim()} className="bg-purple-600 text-white p-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-500/20 transition-all active:scale-95">
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="w-72 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-l border-white/5 h-full flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
          <div className="h-[72px] px-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-sm dark:text-white">Group Members</h3>
            <X className="h-4 w-4 cursor-pointer text-slate-400 hover:text-white" onClick={() => setShowMembers(false)} />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {groupMembers?.map((member: any) => (
              <div key={member._id} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors">
                <div className="relative shrink-0">
                  <img src={member.image} className="w-8 h-8 rounded-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold dark:text-white truncate">{member.name}</p>
                  <p className="text-[10px] text-emerald-500">Online</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}