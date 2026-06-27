"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { getSupabaseBrowser, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowser();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseBrowserConfigured()) {
      throw new Error("Supabase auth is not configured.");
    }

    const config = getSupabasePublicConfig();
    if (!config) {
      throw new Error("Supabase auth is not configured.");
    }

    const supabase = getSupabaseBrowser();
    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        // Browser GET to /authorize cannot send headers — apikey must be a URL param.
        queryParams: { apikey: config.anonKey },
      },
    });

    if (error) throw error;

    if (data?.url?.includes("/rest/v1/auth/")) {
      throw new Error(
        "Invalid Supabase project URL. Set NEXT_PUBLIC_SUPABASE_URL to https://<ref>.supabase.co (without /rest/v1).",
      );
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseBrowserConfigured()) return;

    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signOut }),
    [user, loading, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}