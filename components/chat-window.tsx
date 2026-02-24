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

  // COMBINED EFFECT: Handle Scrolling & Marking as Read
  useEffect(() => {
    // 1. Scroll to bottom when messages change
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });

    // 2. Mark as read when viewing or receiving new messages
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
    <div className="flex h-full w-full bg-white overflow-hidden border-l">
      {/* Main Chat Content */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        
        {/* Fixed Header */}
        <div className="h-[72px] px-6 border-b flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              {conversation?.isGroup ? (
                <Users className="h-5 w-5 text-blue-600" />
              ) : (
                <img src={(conversation as any)?.image} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-gray-900 truncate">{conversation?.name || "Loading..."}</h2>
              <p className="text-[10px] text-green-500 font-medium">
                {conversation?.isGroup ? `${groupMembers?.length || 0} members` : "Online"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400 shrink-0">
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded-lg transition-colors ${showMembers ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"}`}
            >
              <Users className="h-5 w-5" />
            </button>
            <Phone className="h-5 w-5 cursor-pointer hover:text-blue-500" />
            <MoreVertical className="h-5 w-5 cursor-pointer hover:text-blue-500" />
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8f9fa]">
          {messages?.map((msg) => {
            const isMe = msg.senderId === currentUser?._id;
            const showSenderInfo = conversation?.isGroup && !isMe;

            return (
              <div 
                key={msg._id} 
                className={`flex items-end gap-2 group/msg ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-300`}
              >
                {showSenderInfo && (
                  <div className="shrink-0 mb-1">
                    <img 
                      src={msg.senderImage || "/default-avatar.png"} 
                      className="w-8 h-8 rounded-full object-cover shadow-sm border border-white"
                    />
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%] relative`}>
                  {showSenderInfo && (
                    <span className="text-[11px] font-bold text-gray-500 ml-1 mb-1">
                      {msg.senderName}
                    </span>
                  )}

                  <div className="flex items-center gap-2 group">
                  <div className={`flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <button
                      onClick={() => setPickerMessageId(pickerMessageId === msg._id ? null : msg._id)}
                      className={`p-1.5 rounded-lg transition-all ${pickerMessageId === msg._id ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                    >
                      <Smile className="h-4 w-4" />
                    </button>

                    {isMe && !msg.deleted && (
                      <button
                        onClick={() => deleteMessage({ messageId: msg._id })}
                        className="opacity-0 group-hover/msg:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                    {pickerMessageId === msg._id && (
                      <div className={`absolute -top-10 z-20 flex gap-1 bg-white border shadow-xl rounded-full px-2 py-1.5 animate-in zoom-in-95 duration-100 ${isMe ? "right-0" : "left-0"}`}>
                        {COMMON_EMOJIS.map((emoji) => (
                          <button 
                            key={emoji} 
                            onClick={() => {
                              toggleReaction({ messageId: msg._id, emoji });
                              setPickerMessageId(null); // Close after picking
                            }}
                            className="hover:scale-125 transition-transform px-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    

                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                      isMe 
                        ? "bg-blue-600 text-white rounded-tr-none" 
                        : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                    }`}>
                      {msg.deleted ? (
                        <p className="text-sm italic opacity-60">🚫 This message was deleted</p>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.body}
                        </p>
                      )}

                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className={`absolute -bottom-3 ${isMe ? "right-2" : "left-2"} flex gap-1`}>
                          {Object.entries(
                            msg.reactions.reduce((acc: any, r: any) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]: [string, any]) => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction({ messageId: msg._id, emoji })}
                              className="bg-white border shadow-sm rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-1 hover:bg-gray-50 transition-colors"
                            >
                              <span>{emoji}</span>
                              <span className="font-bold text-gray-600">{count}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1">
                        <p className="text-[9px] opacity-70 font-medium">
                          {formatTimestamp(msg._creationTime)}
                        </p>
                        
                        {isMe && (
                          <span>
                            {msg.isRead ? (
                              <CheckCheck className="h-3 w-3 text-blue-300" />
                            ) : (
                              <Check className="h-3 w-3 opacity-70" />
                            )}
                          </span>
                        )}
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
        <div className="bg-white border-t border-gray-100 shrink-0">
          <div className="h-6 px-6 pt-1">
            {typers && typers.length > 0 && (
              <div className="text-[10px] text-blue-500 font-medium italic animate-pulse">
                {typers.join(", ")} {typers.length > 1 ? "are" : "is"} typing...
              </div>
            )}
          </div>
          <div className="p-4 pt-0">
            <form onSubmit={handleSubmit} className="flex gap-2 items-center max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <input
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="button" className="absolute right-3 top-2 text-gray-400 hover:text-blue-500">
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              <button 
                type="submit" 
                disabled={!messageText.trim()}
                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="w-72 bg-white border-l h-full flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
          <div className="h-[72px] px-4 border-b flex items-center justify-between shrink-0">
            <h3 className="font-bold text-sm text-gray-700">Group Members</h3>
            <X className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setShowMembers(false)} />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {groupMembers?.map((member: any) => (
              <div key={member._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="relative shrink-0">
                  <img src={member.image} className="w-8 h-8 rounded-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{member.name}</p>
                  <p className="text-[10px] text-gray-400">Online</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}