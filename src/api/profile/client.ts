import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
};
