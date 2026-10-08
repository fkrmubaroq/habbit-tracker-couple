import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api-client";
import type { Habit } from "../types/index";

export function useMyHabits() {
  return useQuery({
    queryKey: ["my-habits"],
    queryFn: async () => {
      const response = await api.get<{ habits: Habit[] }>("/habits/me");
      return response.data.habits;
    },
  });
}

export function usePartnerHabits() {
  return useQuery({
    queryKey: ["partner-habits"],
    queryFn: async () => {
      const response = await api.get<{ habits: Habit[] }>("/habits/partner");
      return response.data.habits;
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Habit, "id" | "user_id">) => {
      const response = await api.post<{ habit: Habit }>("/habits", data);
      return response.data.habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-habits"] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Habit> & { id: string }) => {
      const response = await api.put<{ habit: Habit }>(`/habits/${id}`, data);
      return response.data.habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-habits"] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/habits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-habits"] });
    },
  });
}
export function useHabitTemplates() {
  return useQuery({
    queryKey: ["habit-templates"],
    queryFn: async () => {
      const response = await api.get<{ templates: Omit<Habit, "id" | "user_id" | "is_active">[] }>("/habits/templates");
      return response.data.templates;
    },
  });
}
