"use client";

import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";

export function AuthSync() {
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    storeUser();
  }, [storeUser]);

  return null;
}