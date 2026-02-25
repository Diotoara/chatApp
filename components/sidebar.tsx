"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Search, Plus, X, Users, CheckCircle2 } from "lucide-react";
import { UserItem } from "./user-item";
import { format, isToday } from "date-fns";

// --- SUB-COMPONENT FOR TYPING LOGIC ---
function SidebarChatItem({ convo, onSelectUser, formatTime }: any) {
  const typers = useQuery(api.conversations.getTypingIndicators, { 
    conversationId: convo._id 
  });

  const isTyping = typers && typers.length > 0;
  const unreadCount = convo.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;
  const isOnline = typeof convo.lastSeen === "number" && Date.now() - convo.lastSeen < 60000;

  return (
    <button
      onClick={() => onSelectUser(convo._id)}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border relative mb-1 ${
        hasUnread 
        ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-sm" 
        : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      <div className="relative shrink-0">
        <div className="relative">
          <img 
            src={convo.image || "/default-avatar.png"} 
            className={`w-12 h-12 rounded-xl object-cover border shadow-sm ${
              hasUnread ? "border-blue-400" : "border-slate-200 dark:border-slate-700"
            }`} 
            alt="" 
          />
          
          {/* Online Indicator */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full z-10 ${
            isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-400"
          }`} />
        </div>

        {/* UNREAD BADGE */}
        {hasUnread && (
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg animate-in zoom-in duration-300">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </div>

      <div className="text-left flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className={`text-sm truncate ${
            hasUnread ? "font-bold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
          }`}>
            {convo.name}
          </p>
          <span className={`text-[10px] ${hasUnread ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"}`}>
            {formatTime(convo.lastMessageTime)}
          </span>
        </div>
        
        <p className={`text-xs truncate ${
          isTyping 
            ? "text-purple-500 font-bold animate-pulse" 
            : hasUnread 
              ? "text-blue-600 dark:text-blue-400 font-semibold" 
              : "text-slate-500"
        }`}>
          {isTyping ? "typing..." : (convo.lastMessage || "No messages yet")}
        </p>
      </div>

      {/* Blue dot indicator for unread (Right Side) */}
      {hasUnread && !isTyping && (
        <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 shrink-0" />
      )}
    </button>
  );
}

// --- MAIN SIDEBAR COMPONENT ---
export function Sidebar({ onSelectUser }: { onSelectUser: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const users = useQuery(api.users.getUsers);
  const myConversations = useQuery(api.conversations.getMyConversations);
  const startChat = useMutation(api.conversations.createOrGetConversation);
  const createGroup = useMutation(api.conversations.createGroup);

  // 1. Search Logic: Filter both existing conversations (groups/chats) and all users
  const searchLower = searchTerm.toLowerCase();
  
  const searchedConversations = myConversations?.filter((c: any) => 
    c.name.toLowerCase().includes(searchLower)
  );

  const searchedDirectory = users?.filter((u: any) => 
    u.name.toLowerCase().includes(searchLower) && 
    !myConversations?.some((c: any) => (c.otherUserId === u._id || c.name === u.name))
  );

  const hasSearchResults = (searchedConversations?.length || 0) + (searchedDirectory?.length || 0) > 0;

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    const conversationId = await createGroup({
      name: groupName,
      userIds: selectedUsers as any,
    });
    onSelectUser(conversationId);
    setIsGroupMode(false);
    setSelectedUsers([]);
    setGroupName("");
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return isToday(date) ? format(date, "h:mm a") : format(date, "MMM d");
  };

  return (
    <div className="w-85 h-full flex flex-col shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 transition-all shadow-sm">
      
      <div className="px-6 pt-8 pb-4 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isGroupMode ? "New Group" : "Chats"}
            </h1>
          </div>
          <button 
            onClick={() => {
              setIsGroupMode(!isGroupMode);
              setSearchTerm("");
              setSelectedUsers([]);
            }}
            className={`p-2.5 rounded-xl transition-all ${isGroupMode ? "bg-slate-100 dark:bg-slate-800" : "bg-blue-600 text-white shadow-md"}`}
          >
            {isGroupMode ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder={isGroupMode ? "Add members..." : "Search messages..."}
            className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isGroupMode && (
          <div className="mt-4 space-y-3">
            <input
              placeholder="Group Name"
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 rounded-xl py-2 px-4 text-sm focus:outline-none dark:text-white"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <button
              onClick={handleCreateGroup}
              disabled={selectedUsers.length === 0 || !groupName.trim()}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-30"
            >
              Create Group ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="space-y-1 pb-8">
          {searchTerm.length > 0 ? (
            /* --- SEARCH VIEW --- */
            <>
              {hasSearchResults ? (
                <>
                  {/* Search results from existing chats (including groups) */}
                  {searchedConversations?.map((convo: any) => (
                    <SidebarChatItem key={convo._id} convo={convo} onSelectUser={onSelectUser} formatTime={formatTime} />
                  ))}
                  {/* Search results from new users */}
                  {searchedDirectory?.map((user: any) => (
                    <button key={user._id} onClick={async () => {
                      const id = await startChat({ otherUserId: user._id });
                      onSelectUser(id);
                      setSearchTerm("");
                    }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 opacity-80">
                      <img src={user.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{user.name}</p>
                    </button>
                  ))}
                </>
              ) : (
                /* --- NO RESULTS FOUND --- */
                <div className="text-center py-12 px-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl py-8 border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Search className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No results found for <span className="text-blue-600 dark:text-blue-400 font-bold">"{searchTerm}"</span>
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : isGroupMode ? (
            /* --- GROUP CREATION VIEW --- */
            users?.map((user: any) => {
              const isSelected = selectedUsers.includes(user._id);
              return (
                <div key={user._id} className="relative">
                  <UserItem user={user} onClick={() => setSelectedUsers(prev => isSelected ? prev.filter(id => id !== user._id) : [...prev, user._id])} />
                  {isSelected && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 fill-white" />}
                </div>
              );
            })
          ) : (
            /* --- STANDARD SIDEBAR VIEW --- */
            <>
              {myConversations?.map((convo: any) => (
                <SidebarChatItem key={convo._id} convo={convo} onSelectUser={onSelectUser} formatTime={formatTime} />
              ))}
              {users?.filter((u: any) => !myConversations?.some((c: any) => (c.otherUserId === u._id || c.name === u.name))).map((user: any) => (
                <button key={user._id} onClick={async () => {
                  const id = await startChat({ otherUserId: user._id });
                  onSelectUser(id);
                }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 opacity-75">
                  <img src={user.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">{user.name}</p>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}