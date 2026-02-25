"use client";

import { useState } from "react";
import { Authenticated, AuthLoading } from "convex/react";
import { Sidebar } from "@/components/sidebar";
import { AuthSync } from "@/components/auth-sync";
import { ChatWindow } from "@/components/chat-window";
import { MessageSquare, Sparkles, ChevronLeft } from "lucide-react";
import Navbar from "@/components/navbar";
import { useTheme } from "./layout";

export default function Page() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { theme } = useTheme();

  return (
    <main className="flex flex-col h-screen w-full bg-white dark:bg-black overflow-hidden transition-colors duration-500">
      
      <AuthLoading>
        <div className="flex items-center justify-center w-full h-full bg-white dark:bg-black">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-600/30 blur-2xl rounded-full" />
              <div className="w-16 h-16 bg-blue-50 dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl flex items-center justify-center relative">
                <MessageSquare className="text-blue-600 dark:text-white h-8 w-8" />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-zinc-500 tracking-[0.2em] uppercase">Initializing Neural Link</p>
          </div>
        </div>
      </AuthLoading>

      <Authenticated>
        <AuthSync />
        
        {/* Navbar: Hidden on mobile when a chat is active to maximize space */}
        <div className={`${activeConversationId ? "hidden md:block" : "block"}`}>
          <Navbar />
        </div>

        <div className="flex flex-1 overflow-hidden p-0 md:p-4 lg:p-6 md:pt-0 gap-0 md:gap-4 lg:gap-8">
          
          {/* SIDEBAR: Hidden on mobile if a conversation is selected */}
          <div className={`w-full md:w-80 lg:w-96 h-full ${activeConversationId ? "hidden md:block" : "block"}`}>
            <Sidebar onSelectUser={(id) => setActiveConversationId(id)} />
          </div>
          
          {/* MAIN CONTENT AREA: Hidden on mobile if NO conversation is selected */}
          <div className={`flex-1 h-full overflow-hidden relative md:rounded-3xl border-0 md:border border-slate-200/50 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl ${!activeConversationId ? "hidden md:flex" : "flex"}`}>
            
            {activeConversationId ? (
              <div className="flex flex-col flex-1 h-full">
                {/* Mobile Back Button Header */}
                <div className="md:hidden flex items-center p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
                  <button 
                    onClick={() => setActiveConversationId(null)}
                    className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                  </button>
                  <span className="ml-2 font-medium dark:text-white">Back to Chats</span>
                </div>

                <ChatWindow conversationId={activeConversationId} />
              </div>
            ) : (
              /* EMPTY STATE (Only visible on Desktop when no chat is active) */
              <div className="flex-1 h-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
                <div className="text-center animate-in fade-in zoom-in duration-700 z-10 px-6">
                  <div className="relative inline-block mb-8">
                    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20" />
                    <div className="relative w-20 h-20 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl flex items-center justify-center border border-slate-100 dark:border-zinc-800">
                      <Sparkles className="h-10 w-10 text-indigo-500" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                    Ready to <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Connect?</span>
                  </h2>
                  <p className="text-gray-500 dark:text-zinc-500 max-w-xs mx-auto text-sm leading-relaxed">
                    Select a contact to initiate an end-to-end encrypted session.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Authenticated>
    </main>
  );
}