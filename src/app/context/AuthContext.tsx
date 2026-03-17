import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
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

// Static session type for hardcoded login
type StaticSession = { userId: string } | null;

type AuthContextValue = {
  session: StaticSession;
  profile: Profile | null;
  business: Business | null;
  loading: boolean;
  signIn: (loginId: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

// Static credentials only for login validation
const STATIC_CREDENTIALS = [
  { loginId: "Yashelectronics", password: "Yashelectronics@2026" },
  { loginId: "Nihalelectronics", password: "Nihalelectronics@2026" },
];

const SESSION_KEY = "static_session_login_id";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StaticSession>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile and business from database using login_id
  const loadProfileFromDatabase = async (loginId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, login_id, role, business_id")
        .eq("login_id", loginId)
        .single();

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

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedLoginId = localStorage.getItem(SESSION_KEY);
    if (savedLoginId) {
      setSession({ userId: savedLoginId });
      loadProfileFromDatabase(savedLoginId);
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (
    loginId: string,
    password: string
  ): Promise<string | null> => {
    if (!loginId.trim() || !password) {
      return "Enter Login ID and Password";
    }

    // Validate against static credentials
    const validUser = STATIC_CREDENTIALS.find(
      (cred) =>
        cred.loginId.toLowerCase() === loginId.trim().toLowerCase() &&
        cred.password === password
    );

    if (!validUser) {
      return "Invalid Login ID or Password";
    }

    // Save to localStorage and set session
    localStorage.setItem(SESSION_KEY, validUser.loginId);
    setSession({ userId: validUser.loginId });

    // Load profile and business data from database
    await loadProfileFromDatabase(validUser.loginId);

    return null;
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
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
