import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import {
  startPeriodicSync,
  setupVisibilitySync,
  setupNetworkSync,
  cleanup,
  sync,
} from "@/lib/sync";

type AuthStoreState = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  initializing: boolean;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthStoreState>((set) => {
  let isInitializing = true;

  const startSync = () => {
    startPeriodicSync(30000);
    setupVisibilitySync();
    setupNetworkSync();
    sync().catch((error) => {
      console.error("Initial sync failed:", error);
    });
  };

  const stopSync = () => {
    cleanup();
  };

  const handleAuthChange = async (session: Session | null) => {
    if (isInitializing) return;

    set({ loading: true, session, user: session?.user || null });

    try {
      if (session?.user?.id) {
        startSync();
      } else {
        stopSync();
      }
    } finally {
      set({ loading: false });
    }
  };

  return {
    session: null,
    user: null,
    isAuthenticated: false,
    initializing: true,
    loading: false,
    async initialize() {
      try {
        set({ loading: true });
        supabase.auth.onAuthStateChange((_, session) => {
          handleAuthChange(session);
        });

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          set({ session: null, user: null, isAuthenticated: false });
        } else {
          set({
            session,
            user: session?.user || null,
            isAuthenticated: !!session?.user && !session?.user.is_anonymous,
          });

          if (session?.user?.id) {
            startSync();
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        set({
          session: null,
          user: null,
          isAuthenticated: false,
        });
      } finally {
        set({ initializing: false, loading: false });
        isInitializing = false;
      }
    },

    async signIn(email: string, password: string) {
      set({ loading: true });
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error ? new Error(error.message) : null };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error("Sign in failed"),
        };
      } finally {
        set({ loading: false });
      }
    },

    async signUp(email: string, password: string) {
      set({ loading: true });
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        return { error: error ? new Error(error.message) : null };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error("Sign up failed"),
        };
      } finally {
        set({ loading: false });
      }
    },

    async signOut() {
      set({ loading: true });
      try {
        await supabase.auth.signOut();
        set({
          session: null,
          user: null,
          isAuthenticated: false,
        });
        stopSync();
      } finally {
        set({ loading: false });
      }
    },
  };
});
