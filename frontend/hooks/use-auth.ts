"use client";

import { useEffect, useState } from "react";
import { getMe, getStoredToken, login, register, setStoredToken, type AuthPayload, type UserProfile } from "@/services/api";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredToken();
    setToken(stored);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    getMe(stored)
      .then((profile) => {
        setUser(profile);
        if (!profile) {
          setStoredToken(null);
          setToken(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function signIn(payload: AuthPayload) {
    const nextToken = await login(payload);
    setStoredToken(nextToken);
    setToken(nextToken);
    setUser(await getMe(nextToken));
  }

  async function signUp(payload: Required<AuthPayload>) {
    const nextToken = await register(payload);
    setStoredToken(nextToken);
    setToken(nextToken);
    setUser(await getMe(nextToken));
  }

  function signOut() {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }

  return { token, user, isLoading, signIn, signUp, signOut };
}
