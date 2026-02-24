"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { Search, Plus, X, Users, CheckCircle2, MessageSquare } from "lucide-react";
import { UserItem } from "./user-item";
import { format, isToday } from "date-fns";

export function Sidebar({ onSelectUser }: { onSelectUser: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  // Data Queries
  const users = useQuery(api.users.getUsers);
  const myConversations = useQuery(api.conversations.getMyConversations);
  
  // Mutations
  const startChat = useMutation(api.conversations.createOrGetConversation);
  const createGroup = useMutation(api.conversations.createGroup);

  const filteredUsers = users?.filter((u: any) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredGroups = myConversations?.filter((convo: any) => 
    convo.isGroup && convo.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="w-80 border-r h-full flex flex-col bg-white shrink-0">
      {/* 1. Header Area - Height fixed to match ChatWindow (72px) */}
      <div className="h-[72px] px-4 border-b flex justify-between items-center bg-gray-50/30 shrink-0">
        <h1 className="font-bold text-xl text-gray-800 tracking-tight">
          {isGroupMode ? "New Group" : "Messages"}
        </h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsGroupMode(!isGroupMode);
              setSearchTerm("");
            }}
            className={`p-2 rounded-full transition-colors ${
              isGroupMode ? "bg-red-50 text-red-500" : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            {isGroupMode ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* 2. Search & Group Input Area */}
      <div className="p-4 space-y-3 bg-white border-b shrink-0">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
          <input
            placeholder={isGroupMode ? "Add members..." : "Search people or groups..."}
            className="w-full bg-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isGroupMode && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <input
              placeholder="Group name..."
              className="w-full bg-blue-50 border border-blue-100 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-400"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <button
              onClick={handleCreateGroup}
              disabled={selectedUsers.length === 0 || !groupName.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold disabled:bg-gray-200 shadow-sm"
            >
              Create Group ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>

      {/* 3. List Area - This handles the scrolling */}
      <div className="flex-1 overflow-y-auto">
        {isGroupMode || searchTerm.length > 0 ? (
        <>
          {/* --- SECTION: GROUPS MATCHED --- */}
          {filteredGroups && filteredGroups.length > 0 && !isGroupMode && (
            <div className="px-4 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Matched Groups
            </div>
          )}
          {filteredGroups?.map((group: any) => (
            <button
              key={group._id}
              onClick={() => {
                onSelectUser(group._id);
                setSearchTerm("");
              }}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-gray-700">{group.name}</p>
            </button>
          ))}

          {/* --- SECTION: USERS MATCHED --- */}
          {filteredUsers && filteredUsers.length > 0 && !isGroupMode && (
            <div className="px-4 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Matched People
            </div>
          )}
          {filteredUsers?.map((user: any) => {
            const isSelected = selectedUsers.includes(user._id);
            return (
              <div key={user._id} className="relative group/item">
                <UserItem 
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
                {/* ... isGroupMode CheckCircle logic ... */}
              </div>
            );
          })}

          {/* --- SECTION: EMPTY STATE --- */}
          {filteredUsers?.length === 0 && filteredGroups?.length === 0 && (
            <div className="flex flex-col items-center justify-center p-10 text-center opacity-60">
              <p className="text-gray-500 text-sm italic">No people or groups found matching "{searchTerm}"</p>
            </div>
          )}
        </>
      ): (
          /* CONVERSATION STATE: Show active chats with unreads/typing */
          myConversations?.map((convo: any) => {
            const isTyping = convo.typingNames && convo.typingNames.length > 0;
            const hasUnread = convo.unreadCount > 0;

            return (
              <button
                key={convo._id}
                onClick={() => onSelectUser(convo._id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors relative group"
              >
                <div className="relative shrink-0">
                  {convo.isGroup ? (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                      <Users className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={convo.image} className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm" />
                      {/* Optional Online Status (requires updatePresence mutation) */}
                      <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                  )}
                  
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                      {convo.unreadCount}
                    </div>
                  )}
                </div>

                <div className="text-left flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                      {convo.name}
                    </p>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatTime(convo.lastMessageTime)}
                    </span>
                  </div>
                  
                  <div className="h-4 flex items-center">
                    {isTyping ? (
                      <p className="text-[11px] text-blue-500 font-medium italic animate-pulse">
                        {convo.typingNames[0]} is typing...
                      </p>
                    ) : (
                      <p className={`text-[11px] truncate ${hasUnread ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                        {convo.lastMessage || (convo.isGroup ? "Group chat" : "No messages yet")}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
        
        {/* Empty State */}
        {(!myConversations || myConversations.length === 0) && !searchTerm && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="text-gray-300 w-6 h-6" />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              No conversations yet.<br />Search for someone to start chatting!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}