import { getProfile } from "./client";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";

export const useProfile = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user?.id ?? ""),
    enabled: !!user?.id,
  });
};
