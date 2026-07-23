/**
 * Midnight Vault — Auth Context
 * Handles Supabase auth state globally with phone number authentication
 */
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

// Admin phone numbers — add your admin phone number here
const ADMIN_PHONE_NUMBERS = ["+1234567890"];

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (phoneNumber: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    phoneNumber: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin =
    !!user && (ADMIN_PHONE_NUMBERS.includes(user.phone ?? "") || user.user_metadata?.is_admin === true);

  const signIn = async (phoneNumber: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ 
      email: `${phoneNumber.replace(/\D/g, "")}@phone.local`,
      password 
    });
    return { error: error?.message ?? null };
  };

  const signUp = async (phoneNumber: string, password: string, fullName: string) => {
    // Create a unique email from phone number for Supabase (which requires email)
    const uniqueEmail = `${phoneNumber.replace(/\D/g, "")}@phone.local`;
    
    const { error } = await supabase.auth.signUp({
      email: uniqueEmail,
      password,
      options: { 
        data: { 
          full_name: fullName,
          phone_number: phoneNumber
        },
        // Disable email verification
        emailRedirectTo: undefined
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
