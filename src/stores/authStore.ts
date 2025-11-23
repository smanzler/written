import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { sync } from "@/lib/sync";
import { useSyncStore } from "./syncStore";
import { db } from "@/lib/db";
import { useSettingsStore } from "./settingsStore";

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

  const handleAuthChange = async (session: Session | null) => {
    if (isInitializing) return;

    set({ loading: true, session, user: session?.user || null });

    try {
      if (session?.user?.id) {
        sync();
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
        const { user } = useAuthStore.getState();
        if (user) {
          await db.journals.where("user_id").equals(user.id).delete();
        }

        const settingsStore = useSettingsStore.getState();
        await settingsStore.resetSettings();

        const syncStore = useSyncStore.getState();
        syncStore.setLastSyncAt(new Date(0));
        syncStore.clearConflicts();
        syncStore.setSyncError(null);

        await supabase.auth.signOut();

        set({
          session: null,
          user: null,
          isAuthenticated: false,
        });
      } finally {
        set({ loading: false });
      }
    },
  };
});
