"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useState, useEffect, createContext, useContext } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import "./globals.css";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 1. Create Theme Context
const ThemeContext = createContext({ theme: "dark", toggle: () => {} });

export const PresenceHandler = () => {
  const updatePresence = useMutation(api.users.updatePresence);

  useEffect(() => {
    // Update presence immediately on load
    updatePresence();

    const interval = setInterval(() => {
      updatePresence();
    }, 30000); // Every 30 seconds

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
  
  // Directly manipulate the DOM for Tailwind v4 selector
  if (next === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

useEffect(() => {
  const saved = localStorage.getItem("ui-theme") as "dark" | "light" || "dark";
  setTheme(saved);
  
  // Initial sync
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);  

  return (
    <html lang="en" className={theme}>
      <body className="transition-colors duration-500">
        <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
          <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
              <PresenceHandler />
              
              {/* ACETERNITY BACKGROUND EFFECTS */}
              <div className="fixed inset-0 bg-slate-50 dark:bg-[#030712] -z-10 overflow-hidden transition-colors duration-500">
                {/* Floating Glow Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-purple-600/10 dark:bg-purple-500/15 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-600/10 dark:bg-blue-500/15 blur-[120px] animate-pulse delay-700" />
              </div>

              {children}
            </ConvexProviderWithClerk>
          </ClerkProvider>
        </ThemeContext.Provider>
      </body>
    </html>
  );
}

// Custom hook to use theme anywhere in your app
export const useTheme = () => useContext(ThemeContext);