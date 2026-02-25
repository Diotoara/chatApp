"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useState, useEffect, createContext, useContext } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton } from "@clerk/nextjs";
import { Loader2, ShieldCheck } from "lucide-react";
import "./globals.css";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const ThemeContext = createContext({ theme: "dark", toggle: () => {} });

export const PresenceHandler = () => {
  const updatePresence = useMutation(api.users.updatePresence);

  useEffect(() => {
    updatePresence();
    const interval = setInterval(() => {
      updatePresence();
    }, 30000);
    return () => clearInterval(interval);
  }, [updatePresence]);

  return null;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ui-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("ui-theme") as "dark" | "light" || "dark";
    setTheme(saved);
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <html lang="en" className={theme}>
      <body className="transition-colors duration-500 bg-slate-50 dark:bg-[#030712]">
        <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
          <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
              
              {/* BACKGROUND EFFECTS */}
              <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-purple-600/10 dark:bg-purple-500/15 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-600/10 dark:bg-blue-500/15 blur-[120px] animate-pulse delay-700" />
              </div>

              {/* 1. LOADING STATE */}
              <AuthLoading>
                <div className="h-screen w-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                </div>
              </AuthLoading>

              {/* 2. LOGGED IN STATE */}
              <Authenticated>
                <PresenceHandler />
                {children}
              </Authenticated>

              {/* 3. LOGGED OUT STATE (LOGIN PAGE) */}
              <Unauthenticated>
                <div className="h-screen w-full flex flex-col items-center justify-center p-4">
                  <div className="w-full max-w-md space-y-8 text-center">
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <div className="p-3 bg-purple-600/20 rounded-2xl border border-purple-500/30">
                          <ShieldCheck className="h-10 w-10 text-purple-500" />
                        </div>
                      </div>
                      <h1 className="text-5xl font-black tracking-tighter dark:text-white">AXON</h1>
                      <p className="text-slate-500 dark:text-slate-400 font-medium tracking-[0.2em] text-xs">
                        NEURAL LINK V2.0
                      </p>
                    </div>

                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 rounded-3xl shadow-2xl">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Encrypted communication channel requires authentication to proceed.
                      </p>
                      
                      <SignInButton mode="modal">
                        <button className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/25 active:scale-95">
                          Establish Connection
                        </button>
                      </SignInButton>
                    </div>

                    <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                      Secure Terminal • TARS-CHATAUP Project
                    </p>
                  </div>
                </div>
              </Unauthenticated>

            </ConvexProviderWithClerk>
          </ClerkProvider>
        </ThemeContext.Provider>
      </body>
    </html>
  );
}

export const useTheme = () => useContext(ThemeContext);