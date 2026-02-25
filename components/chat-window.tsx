"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Send, Smile, Trash2, Users, MoreVertical, Phone, X, Check, CheckCheck } from "lucide-react";
import { format, isToday, isThisYear } from "date-fns";

export function ChatWindow({ conversationId }: { conversationId: any }) {
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);

  const COMMON_EMOJIS = ["❤️", "👍", "🔥", "😂", "😮"];

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
  const toggleReaction = useMutation(api.messages.toggleReaction);
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
                <img src={(conversation as any)?.image} className="w-full h-full object-cover" alt="" />
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
          {messages?.map((msg: any) => {
            const isMe = msg.senderId === currentUser?._id;
            const showSenderInfo = conversation?.isGroup && !isMe;

            return (
              <div key={msg._id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                {!isMe && (
                  <div className="w-8 flex-shrink-0">
                    {showSenderInfo ? (
                      <img src={msg.senderImage || "/default-avatar.png"} className="w-8 h-8 rounded-full object-cover border border-white/10" alt="" />
                    ) : <div className="w-8" />}
                  </div>
                )}

                <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && showSenderInfo && (
                    <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">{msg.senderName}</span>
                  )}

                  <div className="relative group/msg flex items-center gap-2">
                    {/* Hover Actions: Reaction & Delete */}
                    {!msg.deleted && (
                      <div className={`absolute top-0 ${isMe ? "-left-12" : "-right-12"} hidden group-hover/msg:flex items-center bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-white/10 rounded-lg p-1 z-30`}>
                        <button 
                          onClick={() => setPickerMessageId(pickerMessageId === msg._id ? null : msg._id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded text-slate-500 hover:text-purple-500"
                        >
                          <Smile className="h-4 w-4" />
                        </button>
                        {isMe && (
                          <button 
                            onClick={() => deleteMessage({ messageId: msg._id })}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-slate-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Emoji Picker Popover */}
                    {pickerMessageId === msg._id && (
                      <div className={`absolute -top-10 ${isMe ? "right-0" : "left-0"} flex gap-1 bg-white dark:bg-slate-800 border dark:border-white/10 p-1.5 rounded-full shadow-2xl z-40`}>
                        {COMMON_EMOJIS.map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => {
                              toggleReaction({ messageId: msg._id, emoji });
                              setPickerMessageId(null);
                            }}
                            className="hover:scale-125 transition-transform px-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${
                      isMe ? "bg-purple-600 text-white rounded-tr-none" : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-white/5"
                    }`}>
                      {msg.deleted ? (
                        <p className="text-sm italic opacity-60 flex items-center gap-2">
                          <Trash2 className="h-3.5 w-3.5" /> This message was deleted
                        </p>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                          
                          {/* --- FIXED REACTION DISPLAY --- */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="absolute -bottom-3 left-2 flex gap-1">
                              {(() => {
                                // 1. Group the reaction objects by emoji
                                const counts = msg.reactions.reduce((acc: Record<string, number>, r: any) => {
                                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                  return acc;
                                }, {});

                                // 2. Render the entries (emoji + count)
                                return Object.entries(counts).map(([emoji, count]) => (
                                  <div key={emoji} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm flex items-center gap-1">
                                    <span>{emoji}</span>
                                    <span className="font-bold text-slate-600 dark:text-slate-400">{count as number}</span>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                        <p className="text-[9px] font-medium">{formatTimestamp(msg._creationTime)}</p>
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
          
          {/* SAFE TYPING CHECK: (typers?.length ?? 0) handles the undefined loading state */}
          <div className={`${(typers?.length ?? 0) > 0 ? "h-6 opacity-100" : "h-0 opacity-0"} transition-all duration-300 mb-1 px-2 overflow-hidden`}>
            <p className="text-[10px] text-purple-500 font-bold italic animate-pulse">
              {typers?.join(", ")} {(typers?.length ?? 0) > 1 ? "are" : "is"} typing...
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 items-center max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <input
                value={messageText}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
              />
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
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {groupMembers?.map((member: any) => {
              // REAL-TIME ONLINE CALCULATION
              const isOnline = member.lastSeen && (Date.now() - member.lastSeen < 60000);
              
              return (
                <div key={member._id} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="relative shrink-0">
                    <img src={member.image} className="w-8 h-8 rounded-full object-cover" alt="" />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-slate-900 rounded-full ${isOnline ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-slate-500"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold dark:text-white truncate">{member.name}</p>
                    <p className={`text-[10px] ${isOnline ? "text-emerald-500" : "text-slate-500"}`}>
                      {isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}