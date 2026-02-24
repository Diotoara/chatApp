"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { Search } from "lucide-react"; // npm install lucide-react if you haven't

export function Sidebar({ onSelectUser }: { onSelectUser: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const users = useQuery(api.users.getUsers);
  const startChat = useMutation(api.conversations.createOrGetConversation);

  // Simple filter for Search
  const filteredUsers = users?.filter((u:any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = async (userId: any) => {
    const conversationId = await startChat({ otherUserId: userId });
    onSelectUser(conversationId);
  };

  return (
    <div className="w-80 border-r h-full flex flex-col bg-white">
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="font-bold text-xl">Chats</h1>
        <UserButton />
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search users..."
            className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers?.map((user:any) => (
          <button
            key={user._id}
            onClick={() => handleUserClick(user._id)}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
          >
            <img src={user.image} className="w-10 h-10 rounded-full object-cover" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-green-500 font-medium">Online</p>
            </div>
          </button>
        ))}
        {filteredUsers?.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <p className="text-gray-500 text-sm italic">No users found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}