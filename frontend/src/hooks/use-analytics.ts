import { useQuery } from "@tanstack/react-query";
import api from "../lib/api-client";

interface AnalyticsResponse {
  summary: {
    period: "daily" | "weekly" | "monthly";
    startDate: string;
    endDate: string;
    userCompletionRate: number;
    partnerCompletionRate: number;
    userTotalCompletions: number;
    partnerTotalCompletions: number;
  };
  chartData: Array<{
    period: string;
    userCompletions: number;
    partnerCompletions: number;
    userRate: number;
    partnerRate: number;
  }>;
  streakHistory: Array<{
    habitId: string;
    title: string;
    currentStreak: number;
    longestStreak: number;
    iconEmoji: string;
  }>;
}

export function useAnalytics(
  period: "daily" | "weekly" | "monthly",
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ["analytics", period, startDate, endDate],
    queryFn: async () => {
      const response = await api.get<AnalyticsResponse>("/analytics", {
        params: { period, startDate, endDate },
      });
      return response.data;
    },
  });
}
