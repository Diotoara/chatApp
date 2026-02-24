"use client";

import { useState } from "react";
import { Authenticated, AuthLoading } from "convex/react";
import { Sidebar } from "@/components/sidebar";
import { AuthSync } from "@/components/auth-sync";
import { ChatWindow } from "@/components/chat-window";
import { MessageSquare } from "lucide-react";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    // Fixed height of screen and hidden overflow on the root
    <main className="flex h-screen w-full bg-white overflow-hidden">
      <AuthLoading>
        <div className="flex items-center justify-center w-full h-full bg-white">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Loading your chats...</p>
          </div>
        </div>
      </AuthLoading>

      <Authenticated>
        <AuthSync />
        {/* Sidebar maintains its own scrollbar */}
        <Sidebar onSelectUser={(id) => setActiveConversationId(id)} />
        
        {/* The main content area: flex-1 ensures it takes all remaining width */}
        <div className="flex-1 h-full overflow-hidden relative">
          {activeConversationId ? (
            <ChatWindow conversationId={activeConversationId} />
          ) : (
            <div className="flex-1 h-full flex items-center justify-center bg-[#f8f9fa]">
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-10 w-10 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Your Messages</h2>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">
                  Select a contact or group from the sidebar to start a conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </Authenticated>
    </main>
  );
}