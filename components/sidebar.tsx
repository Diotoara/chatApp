"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { Search, MessageSquareOff } from "lucide-react";
import { UserItem } from "./user-item";

export function Sidebar({ onSelectUser }: { onSelectUser: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const users = useQuery(api.users.getUsers);
  const startChat = useMutation(api.conversations.createOrGetConversation);

  const filteredUsers = users?.filter((u: any) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = async (userId: any) => {
    const conversationId = await startChat({ otherUserId: userId });
    onSelectUser(conversationId);
  };

  return (
    <div className="w-80 border-r h-full flex flex-col bg-white shadow-xl">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
        <h1 className="font-bold text-xl text-gray-800 tracking-tight">Messages</h1>
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            placeholder="Search people..."
            className="w-full bg-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers?.map((user: any) => (
          <UserItem 
            key={user._id} 
            user={user} 
            onClick={() => handleUserClick(user._id)} 
          />
        ))}
        
        {filteredUsers?.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center opacity-60">
            <p className="text-gray-500 text-sm italic">No users found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Small helper component for the unread badge logic
function UnreadBadge({ userId }: { userId: any }) {
  // Logic to fetch unread count for the conversation with this user
  // This requires a helper query in conversations.ts
  return null; // For now, keep it hidden until the query is built
}