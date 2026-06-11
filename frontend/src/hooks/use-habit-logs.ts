import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api-client";
import type { HabitLog, Streak, Badge } from "../types/index";

export function useMyLogs(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["my-logs", startDate, endDate],
    queryFn: async () => {
      const response = await api.get<{ logs: HabitLog[] }>("/habit-logs/me", {
        params: { startDate, endDate },
      });
      return response.data.logs;
    },
  });
}

export function usePartnerLogs(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["partner-logs", startDate, endDate],
    queryFn: async () => {
      const response = await api.get<{ logs: HabitLog[] }>("/habit-logs/partner", {
        params: { startDate, endDate },
      });
      return response.data.logs;
    },
  });
}

interface ToggleResponse {
  message: string;
  log: HabitLog;
  streak: Streak;
  unlockedBadges: Badge[];
}

export function useToggleCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      habit_id: string;
      completed_date: string;
      is_completed: boolean;
      notes?: string | null;
    }) => {
      const response = await api.post<ToggleResponse>("/habit-logs/toggle", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["my-logs"] });
      queryClient.invalidateQueries({ queryKey: ["partner-logs"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["my-habits"] });
    },
  });
}
