"use client";

import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";

export function AuthSync() {
  const storeUser = useMutation(api.users.storeUser);
  const updatePresence = useMutation(api.users.updatePresence);

  useEffect(() => {
    storeUser();
    const interval = setInterval(() => updatePresence(), 30000);
    return () => clearInterval(interval);
  }, [storeUser, updatePresence]);

  return null;
}

