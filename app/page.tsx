"use client";

import { useState } from "react";
import { Authenticated, AuthLoading } from "convex/react";
import { Sidebar } from "@/components/sidebar";
import { AuthSync } from "@/components/auth-sync";
import { ChatWindow } from "@/components/chat-window";
import { MessageSquare, Sparkles } from "lucide-react";
import Navbar from "@/components/navbar";
import { useTheme } from "./layout"; // Import the theme hook


export default function Page() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { theme } = useTheme();

  return (
    // The main container now responds to the theme
    <main className="flex flex-col h-screen w-full bg-white dark:bg-transparent overflow-hidden transition-colors duration-500">
      
      <AuthLoading>
        <div className="flex items-center justify-center w-full h-full bg-white dark:bg-[#030712]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full" />
              <div className="w-16 h-16 bg-blue-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center relative">
                <MessageSquare className="text-blue-600 dark:text-purple-500 h-8 w-8" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 tracking-widest uppercase">Initializing Neural Link...</p>
          </div>
        </div>
      </AuthLoading>

      <Authenticated>
        <AuthSync />
        
        {/* 1. TOP NAVBAR ADDED HERE */}
        <Navbar />

        <div className="flex flex-1 overflow-hidden p-4 lg:p-6 pt-0 gap-4 lg:gap-6">
          
          {/* 2. SIDEBAR (Passed styles via its own component usually) */}
          <Sidebar onSelectUser={(id) => setActiveConversationId(id)} />
          
          {/* 3. MAIN CONTENT AREA */}
          <div className="flex-1 h-full overflow-hidden relative rounded-3xl border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-slate-900/20 backdrop-blur-xl shadow-2xl">
            {activeConversationId ? (
              <ChatWindow conversationId={activeConversationId} />
            ) : (
              /* MODERN EMPTY STATE */
              <div className="flex-1 h-full flex items-center justify-center relative overflow-hidden">
                {/* Subtle spotlight effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.05),transparent_50%)]" />
                
                <div className="text-center animate-in fade-in zoom-in duration-700 z-10">
                  <div className="relative inline-block mb-6">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl blur opacity-30 animate-pulse" />
                    <div className="relative w-24 h-24 bg-white dark:bg-slate-900 rounded-3xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-white/10">
                      <Sparkles className="h-12 w-12 text-purple-500" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                    Start a private <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">conversation</span>
                  </h2>
                  <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Choose a contact from the sidebar to begin a secure exchange.
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