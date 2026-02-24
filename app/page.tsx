"use client";

import { useState } from "react";
import { Authenticated, AuthLoading } from "convex/react";
import { Sidebar } from "@/components/sidebar";
import { AuthSync } from "@/components/auth-sync";
import { ChatWindow } from "@/components/chat-window";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <main className="flex h-screen bg-gray-100">
      <AuthLoading>
        <div className="flex items-center justify-center w-full bg-white">Loading...</div>
      </AuthLoading>

      <Authenticated>
        <AuthSync />
        <Sidebar onSelectUser={(id) => setActiveConversationId(id)} />
        
        <div className="flex-1 flex flex-col bg-white">
          {activeConversationId ? (
            <div className="flex-1 flex flex-col">
              {/* Feature #3: We will build the ChatWindow component next! */}
              <div className="flex-1 flex flex-col">
                {activeConversationId ? (
                  <ChatWindow conversationId={activeConversationId} />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    {/* (Keep your empty state UI here) */}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Select a user to start chatting</h2>
                <p className="text-gray-500">Pick a friend from the left to send a message</p>
              </div>
            </div>
          )}
        </div>
      </Authenticated>
    </main>
  );
}