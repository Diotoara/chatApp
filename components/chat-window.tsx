"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Send, Smile } from "lucide-react";
import { format, isToday, isThisYear } from "date-fns";

export function ChatWindow({ conversationId }: { conversationId: any }) {
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convex Data
  const messages = useQuery(api.messages.list, { conversationId });
  const currentUser = useQuery(api.users.getMe);
  const typers = useQuery(api.conversations.getTypingIndicators, { conversationId });
  
  // Mutations
  const sendMessage = useMutation(api.messages.send);
  const setTyping = useMutation(api.conversations.setTyping);
  const markRead = useMutation(api.conversations.markAsRead);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    if (conversationId) markRead({ conversationId });
  }, [messages, conversationId, markRead]);

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
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8f9fa]">
        {messages?.map((msg) => {
          const isMe = msg.senderId === currentUser?._id;
          
          return (
            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                isMe 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
              }`}>
                {msg.deleted ? (
                  <p className="text-sm italic opacity-70 text-gray-400">This message was deleted</p>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.body}</p>
                )}
                <p className={`text-[10px] mt-1.5 font-medium ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                  {formatTimestamp(msg._creationTime)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Ephemeral Overlays (Typing) */}
      <div className="h-6 px-6 bg-[#f8f9fa]">
        {typers && typers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-blue-500 font-medium italic animate-pulse">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            {typers.join(", ")} is typing...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center max-w-5xl mx-auto">
          <div className="flex-1 relative">
            <input
              value={messageText}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="w-full bg-gray-100 rounded-2xl px-5 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border-none"
            />
            <button type="button" className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-blue-500">
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <button 
            type="submit" 
            disabled={!messageText.trim()}
            className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}