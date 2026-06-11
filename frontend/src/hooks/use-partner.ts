import { useQuery } from "@tanstack/react-query";
import api from "../lib/api-client";
import type { User } from "../types/index";

export function usePartnerProfile() {
  return useQuery({
    queryKey: ["partner-profile"],
    queryFn: async () => {
      try {
        const response = await api.get<{ partner: Omit<User, "password_hash" | "theme_preferences"> }>("/users/partner");
        return response.data.partner;
      } catch (err: any) {
        // Return null if partner is not linked or not found
        return null;
      }
    },
    retry: false, // Don't retry if partner is not linked
  });
}
