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
    onMutate: async (newLog) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["my-logs"] });

      // Snapshot the previous value
      const previousLogs = queryClient.getQueriesData<HabitLog[]>({ queryKey: ["my-logs"] });

      // Optimistically update to the new value
      queryClient.setQueriesData<HabitLog[]>({ queryKey: ["my-logs"] }, (old) => {
        if (!old) return [];
        if (newLog.is_completed) {
          const exists = old.some((log) => log.habit_id === newLog.habit_id && log.completed_date === newLog.completed_date);
          if (exists) {
            return old.map((log) =>
              log.habit_id === newLog.habit_id && log.completed_date === newLog.completed_date
                ? { ...log, is_completed: true }
                : log
            );
          }
          return [
            ...old,
            {
              id: `temp-${Date.now()}`,
              habit_id: newLog.habit_id,
              user_id: "",
              completed_date: newLog.completed_date,
              is_completed: true,
              notes: newLog.notes || null,
            },
          ];
        } else {
          return old.filter((log) => !(log.habit_id === newLog.habit_id && log.completed_date === newLog.completed_date));
        }
      });

      // Return a context object with the snapshotted value
      return { previousLogs };
    },
    onError: (err, newLog, context) => {
      // Revert back to the snapshot
      if (context?.previousLogs) {
        context.previousLogs.forEach(([queryKey, value]) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
    },
    onSettled: () => {
      // Always refetch or invalidate after success or error
      queryClient.invalidateQueries({ queryKey: ["my-logs"] });
      queryClient.invalidateQueries({ queryKey: ["partner-logs"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["my-habits"] });
    },
  });
}
