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

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

type AuthStoreState = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  initializing: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: (userId?: string) => Promise<void>;
};

export const useAuthStore = create<AuthStoreState>((set) => {
  let isInitializing = true;

  const fetchProfile = async (userId?: string) => {
    if (!userId) {
      set({ profile: null, profileLoading: false });
      return;
    }

    set({ profileLoading: true });

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        set({ profile: null });
      } else {
        set({ profile: data });
      }
    } catch (error) {
      console.error("Error in profile fetch flow:", error);
      set({ profile: null });
    } finally {
      set({ profileLoading: false });
    }
  };

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

    set({ session, user: session?.user || null });

    if (session?.user?.id) {
      await fetchProfile(session.user.id);
      startSync();
    } else {
      set({ profile: null, profileLoading: false });
      stopSync();
    }
  };

  return {
    session: null,
    user: null,
    isAuthenticated: false,
    profile: null,
    profileLoading: true,
    initializing: true,

    async initialize() {
      try {
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
            await fetchProfile(session.user.id);
            startSync();
          } else {
            set({ profile: null, profileLoading: false });
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          profile: null,
        });
      } finally {
        set({ initializing: false });
        isInitializing = false;
      }
    },

    async signOut() {
      await supabase.auth.signOut();
      set({ session: null, user: null, isAuthenticated: false, profile: null });
      stopSync();
    },

    setProfile(profile) {
      set({ profile });
    },

    fetchProfile,
  };
});
