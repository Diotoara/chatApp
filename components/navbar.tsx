"use client";

import { useTheme } from "../app/layout"; // Adjust path to your layout file
import { Sun, Moon, Hash, Bell, Settings, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const { theme, toggle } = useTheme();

  return (
    <nav className="h-[72px] px-6 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 shadow-sm z-50">
      {/* Left side: Brand/Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          <Hash className="text-white h-5 w-5" />
        </div>
        <div className="hidden sm:block">
          <h1 className="font-black tracking-tighter text-slate-900 dark:text-white text-xl">Tars</h1>
          <p className="text-[10px] text-purple-500 font-mono uppercase tracking-widest leading-none">Chat App v-1.0.4</p>
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Futuristic Theme Toggle */}
        <button
          onClick={toggle}
          className="group relative flex h-9 w-16 items-center rounded-full bg-slate-200/50 dark:bg-slate-800/50 p-1 transition-all duration-300 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300/50 dark:border-white/10"
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500 ${
            theme === "dark" 
              ? "translate-x-7 bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.6)]" 
              : "translate-x-0 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]"
          }`}>
            {theme === "dark" ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-white" />}
          </div>
        </button>

        <div className="h-8 w-[1px] bg-slate-300/50 dark:bg-white/10 mx-2 hidden sm:block" />

        <Bell className="h-5 w-5 text-slate-500 hover:text-purple-500 cursor-pointer transition-colors" />
        <Settings className="h-5 w-5 text-slate-500 hover:text-purple-500 cursor-pointer transition-colors" />
        
        {/* User Profile from Clerk */}
        <div className="pl-2 border-l border-slate-300/50 dark:bg-white/10">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}