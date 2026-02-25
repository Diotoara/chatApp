"use client";

import { useState } from "react";
import { Authenticated, AuthLoading } from "convex/react";
import { Sidebar } from "@/components/sidebar";
import { AuthSync } from "@/components/auth-sync";
import { ChatWindow } from "@/components/chat-window";
import { MessageSquare, Sparkles } from "lucide-react";
import Navbar from "@/components/navbar";
import { useTheme } from "./layout";

export default function Page() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { theme } = useTheme();

  return (
    // Changed dark:bg-transparent to dark:bg-black for that pitch-black base
    <main className="flex flex-col h-screen w-full bg-white dark:bg-black overflow-hidden transition-colors duration-500">
      
      <AuthLoading>
        {/* Loading state now uses absolute black */}
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
        
        <Navbar />

        {/* Added more padding and gap for the "floating" card look */}
        <div className="flex flex-1 overflow-hidden p-4 lg:p-6 pt-0 gap-4 lg:gap-8">
          
          <Sidebar onSelectUser={(id) => setActiveConversationId(id)} />
          
          {/* MAIN CONTENT AREA: Pure black background with thin, sharp borders */}
          <div className="flex-1 h-full overflow-hidden relative rounded-3xl border border-slate-200/50 dark:border-zinc-800 bg-white/50 dark:bg-black shadow-2xl">
            {activeConversationId ? (
              <ChatWindow conversationId={activeConversationId} />
            ) : (
              /* MODERN EMPTY STATE - OLED STYLE */
              <div className="flex-1 h-full flex items-center justify-center relative overflow-hidden">
                {/* Sharper, more centered glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
                
                <div className="text-center animate-in fade-in zoom-in duration-700 z-10 px-6">
                  <div className="relative inline-block mb-8">
                    {/* Aceternity-style glow effect */}
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