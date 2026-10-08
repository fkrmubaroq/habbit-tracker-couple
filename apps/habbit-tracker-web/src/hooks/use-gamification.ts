import { useQuery } from "@tanstack/react-query";
import api from "../lib/api-client";
import type { LeaderboardEntry, Badge } from "../types/index";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const response = await api.get<{
        leaderboard: LeaderboardEntry[];
        weekRange: { startDate: string; endDate: string };
      }>("/gamification/leaderboard");
      return response.data;
    },
  });
}

export function useEarnedBadges() {
  return useQuery({
    queryKey: ["earned-badges"],
    queryFn: async () => {
      const response = await api.get<{ badges: Badge[] }>("/gamification/badges/earned");
      return response.data.badges;
    },
  });
}

export function useAllBadges() {
  return useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const response = await api.get<{ badges: Badge[] }>("/gamification/badges");
      return response.data.badges;
    },
  });
}
