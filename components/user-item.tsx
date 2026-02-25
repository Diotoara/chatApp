"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function UserItem({ user, onClick }: { user: any; onClick: () => void }) {
// 1. Get Conversation ID
    const conversationId = useQuery(api.conversations.getConversationWithUser, { 
        otherUserId: user._id 
    });

    // 2. ONLY run the unread count query if conversationId is truthy
    // Note the change: we pass conversationId || skip
    const unreadCount = useQuery(
        api.messages.getUnreadCount, 
        conversationId ? { conversationId } : "skip" // This prevents the error
    ) ?? 0;

    // 3. Same for typers
    const typers = useQuery(
        api.conversations.getTypingIndicators, 
        conversationId ? { conversationId } : "skip"
    );
  const isTyping = typers && typers.length > 0;

  // 4. Presence Logic (Feature 7)
  const isOnline = user.lastSeen > Date.now() - 120000;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 group"
    >
      <div className="relative">
        <img src={user.image} className="w-12 h-12 rounded-full object-cover shadow-sm" />
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      <div className="text-left flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-white transition-colors truncate">{user.name}</p>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        
        <p className="text-xs truncate">
          {isTyping ? (
            <span className="text-blue-500 font-medium italic animate-pulse">typing...</span>
          ) : (
            <span className={isOnline ? "text-green-600" : "text-xs text-slate-500 dark:text-slate-400"}>
              {isOnline ? "Online" : "Offline"}
            </span>
          )}
        </p>
      </div>
    </button>
  );
}