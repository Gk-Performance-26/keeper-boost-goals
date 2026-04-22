import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

const LOGIN_TIMESTAMP_KEY = "auth-login-at";
const SESSION_MAX_DAYS = 14;
const SESSION_MAX_MS = SESSION_MAX_DAYS * 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set listener BEFORE getSession to avoid missed events
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Record login moment so we can enforce a 14-day max session
      if (event === "SIGNED_IN" && newSession) {
        const existing = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
        if (!existing) {
          localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
        }
      }
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      }
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      const current = data.session;
      if (current) {
        const loginAtRaw = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
        // First time we see this session — anchor the timestamp now
        if (!loginAtRaw) {
          localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
        } else {
          const loginAt = parseInt(loginAtRaw, 10);
          if (!Number.isNaN(loginAt) && Date.now() - loginAt > SESSION_MAX_MS) {
            // Session older than 14 days — force re-login
            await supabase.auth.signOut();
            localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        }
      }
      setSession(current);
      setUser(current?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
