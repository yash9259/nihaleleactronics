import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Role = "master" | "admin";

type Business = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  login_id: string;
  role: Role;
  business_id: string;
};

type AuthContextValue = {
  session: { user: { id: string } } | null;
  profile: Profile | null;
  business: Business | null;
  loading: boolean;
  signIn: (loginId: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

type LocalSession = { user: { id: string } } | null;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LocalSession>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  const loadProfileFromDatabase = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, login_id, role, business_id")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        setProfile(null);
        setBusiness(null);
        return;
      }

      setProfile(data as Profile);

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("id", data.business_id)
        .maybeSingle();

      if (businessError) {
        setBusiness(null);
        return;
      }

      setBusiness((businessData as Business | null) ?? null);
    } catch (err) {
      console.error("Error loading profile from database:", err);
      setProfile(null);
      setBusiness(null);
    }
  };

  useEffect(() => {
    const hydrateFromSession = (nextSession: LocalSession) => {
      setSession(nextSession);
      setLoading(false);

      const userId = nextSession?.user?.id ?? null;
      if (!userId) {
        lastLoadedUserIdRef.current = null;
        setProfile(null);
        setBusiness(null);
        return;
      }

      if (lastLoadedUserIdRef.current === userId) {
        return;
      }

      lastLoadedUserIdRef.current = userId;
      void loadProfileFromDatabase(userId);
    };

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        hydrateFromSession(null);
        return;
      }

      hydrateFromSession(data.session as LocalSession);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, nextSession: LocalSession) => {
      hydrateFromSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    loginId: string,
    password: string
  ): Promise<string | null> => {
    if (!loginId.trim() || !password) {
      return "Enter Login ID and Password";
    }

    const input = loginId.trim().toLowerCase();
    const candidateEmails = input.includes("@")
      ? [input]
      : [`${input}@gmail.com`, `${input}@admin.example.com`, `${input}@admin.local`];

    let lastError: string | null = null;

    for (const email of candidateEmails) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.session) {
        setSession(data.session as LocalSession);
        await loadProfileFromDatabase(data.session.user.id);
        return null;
      }

      lastError = error?.message ?? lastError;
    }

    return lastError ?? "Invalid Login ID or Password";
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setBusiness(null);
  };

  const value = useMemo(
    () => ({ session, profile, business, loading, signIn, signOut }),
    [session, profile, business, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
