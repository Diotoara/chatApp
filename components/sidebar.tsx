"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Search, Plus, X, Users, CheckCircle2, MessageSquare } from "lucide-react";
import { UserItem } from "./user-item";
import { format, isToday } from "date-fns";

export function Sidebar({ onSelectUser }: { onSelectUser: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const users = useQuery(api.users.getUsers);
  const myConversations = useQuery(api.conversations.getMyConversations);
  const startChat = useMutation(api.conversations.createOrGetConversation);
  const createGroup = useMutation(api.conversations.createGroup);

  const filteredUsers = users?.filter((u: any) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      
      {/* Header */}
      <div className="px-6 pt-8 pb-4 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isGroupMode ? "New Group" : "Chats"}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {myConversations?.length || 0} conversations
            </p>
          </div>
          <button 
            onClick={() => {
              setIsGroupMode(!isGroupMode);
              setSearchTerm("");
              setSelectedUsers([]);
            }}
            className={`p-2.5 rounded-xl transition-all ${
              isGroupMode 
              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" 
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            }`}
          >
            {isGroupMode ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder={isGroupMode ? "Add members..." : "Search messages..."}
            className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none dark:text-white border border-transparent focus:border-blue-500/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isGroupMode && (
          <div className="mt-4 space-y-3">
            <input
              placeholder="Group Name"
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 ring-blue-500/20 dark:text-white"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <button
              onClick={handleCreateGroup}
              disabled={selectedUsers.length === 0 || !groupName.trim()}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-30 shadow-md transition-all active:scale-95"
            >
              Create Group ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-1 pb-8">
          {searchTerm.length > 0 || isGroupMode ? (
            <>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => {
                  const isSelected = selectedUsers.includes(user._id);
                  return (
                    <div key={user._id} className="relative group/item">
                      <UserItem 
                        key={user._id}
                        user={user} 
                        onClick={async () => {
                          if (isGroupMode) {
                            setSelectedUsers(prev => 
                              isSelected ? prev.filter(id => id !== user._id) : [...prev, user._id]
                            );
                          } else {
                            const id = await startChat({ otherUserId: user._id });
                            onSelectUser(id);
                            setSearchTerm("");
                          }
                        }} 
                      />
                      {isGroupMode && isSelected && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <CheckCircle2 className="h-5 w-5 text-blue-600 fill-white" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-500">No users found for "{searchTerm}"</p>
                </div>
              )}
            </>
          ) : (
            /* CONVERSATION LIST */
            myConversations?.map((convo: any) => {
              const hasUnread = convo.unreadCount > 0;
              // Check real online status: active in last 60 seconds
              const lastSeen = convo.otherUser?.lastSeen;
              const isOnline =
                typeof convo.lastSeen === "number" &&
                Date.now() - convo.lastSeen < 10 * 1000;
                
              console.log("lastSeen:", convo.lastSeen);
              return (
                <button
                  key={convo._id}
                  onClick={() => onSelectUser(convo._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border relative mb-1 ${
                    hasUnread 
                    ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-sm" 
                    : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="relative shrink-0">
                    {convo.isGroup ? (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <Users className="h-6 w-6" />
                      </div>
                    ) : (
                      <div className="relative">
                        <img src={convo.image} className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                        {/* THE DYNAMIC GREEN DOT */}
                        {!convo.isGroup && (
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full z-20 ${
                            isOnline ? "bg-emerald-500" : "bg-slate-400"
                          }`} />
                        )}
                      </div>
                    )}
                    
                    
                    {hasUnread && (
                      <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                        {convo.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${hasUnread ? "font-bold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                        {convo.name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(convo.lastMessageTime)}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${hasUnread ? "text-blue-600 dark:text-blue-400 font-medium" : "text-slate-500"}`}>
                      {convo.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}