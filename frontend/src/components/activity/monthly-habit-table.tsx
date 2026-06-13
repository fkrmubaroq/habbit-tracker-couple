import dayjs from "dayjs";
import { Calendar, Check, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useMyLogs, usePartnerLogs, useToggleCompletion } from "../../hooks/use-habit-logs";
import { useMyHabits, usePartnerHabits } from "../../hooks/use-habits";
import { usePartnerProfile } from "../../hooks/use-partner";
import type { Habit } from "../../types/index";
import { Select } from "../ui/select";
import { useToastStore } from "../../stores/toast.store";

interface MonthlyHabitTableProps {
  currentUserId?: string;
}

export function MonthlyHabitTable({ currentUserId }: MonthlyHabitTableProps) {
  const { t } = useTranslation();
  const { showToast } = useToastStore();
  const today = dayjs();

  // State for selectors
  const [selectedMonth, setSelectedMonth] = React.useState<number>(today.month()); // 0-11
  const [selectedYear, setSelectedYear] = React.useState<number>(today.year());
  const [userFilter, setUserFilter] = React.useState<"me" | "partner" | "couple">("me");
  const [frequencyFilter, setFrequencyFilter] = React.useState<"all" | "daily" | "weekly" | "monthly">("all");

  // Format date range for the selected month
  const startDateStr = React.useMemo(() => {
    return dayjs().year(selectedYear).month(selectedMonth).startOf("month").format("YYYY-MM-DD");
  }, [selectedMonth, selectedYear]);

  const endDateStr = React.useMemo(() => {
    return dayjs().year(selectedYear).month(selectedMonth).endOf("month").format("YYYY-MM-DD");
  }, [selectedMonth, selectedYear]);

  // Fetch habits and logs
  const { data: myHabits = [], isLoading: myHabitsLoading } = useMyHabits();
  const { data: partnerHabits = [], isLoading: partnerHabitsLoading } = usePartnerHabits();
  const { data: myLogs = [], isLoading: myLogsLoading } = useMyLogs(startDateStr, endDateStr);
  const { data: partnerLogs = [], isLoading: partnerLogsLoading } = usePartnerLogs(startDateStr, endDateStr);
  const { data: partner } = usePartnerProfile();

  const toggleMutation = useToggleCompletion();

  // Calculate days in the selected month
  const daysInMonth = React.useMemo(() => {
    return dayjs().year(selectedYear).month(selectedMonth).daysInMonth();
  }, [selectedMonth, selectedYear]);

  const daysArray = React.useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Combine habits based on filter
  const habitsList = React.useMemo(() => {
    let list: Habit[] = [];
    if (userFilter === "me") {
      list = myHabits;
    } else if (userFilter === "partner") {
      list = partnerHabits;
    } else {
      // "couple" - combine and deduplicate shared habits
      const myMap = new Map(myHabits.map(h => [h.id, h]));
      const partnerMap = new Map(partnerHabits.map(h => [h.id, h]));

      const allIds = new Set([...myMap.keys(), ...partnerMap.keys()]);
      list = Array.from(allIds)
        .map(id => myMap.get(id) || partnerMap.get(id)!)
        .filter(h => h.is_shared);
    }

    // Filter by frequency
    if (frequencyFilter !== "all") {
      list = list.filter(h => h.frequency === frequencyFilter);
    }

    // We show active habits, plus archived habits that have completion logs in this month
    const activeHabits = list.filter(h => h.is_active);
    const archivedHabits = list.filter(h => !h.is_active);

    const logsToCheck = userFilter === "partner" ? partnerLogs : myLogs;
    const completedHabitIdsInMonth = new Set(logsToCheck.filter(l => l.is_completed).map(l => l.habit_id));

    const relevantArchived = archivedHabits.filter(h => completedHabitIdsInMonth.has(h.id));

    return [...activeHabits, ...relevantArchived];
  }, [myHabits, partnerHabits, userFilter, frequencyFilter, myLogs, partnerLogs]);

  // Maps for fast lookup: habit_id -> day -> is_completed
  const myLogsMap = React.useMemo(() => {
    const map = new Map<string, Map<number, { is_completed: boolean; id: string; notes: string | null }>>();
    myLogs.forEach(log => {
      if (!map.has(log.habit_id)) {
        map.set(log.habit_id, new Map());
      }
      const day = dayjs(log.completed_date).date();
      map.get(log.habit_id)!.set(day, {
        is_completed: log.is_completed,
        id: log.id,
        notes: log.notes
      });
    });
    return map;
  }, [myLogs]);

  const partnerLogsMap = React.useMemo(() => {
    const map = new Map<string, Map<number, { is_completed: boolean; id: string; notes: string | null }>>();
    partnerLogs.forEach(log => {
      if (!map.has(log.habit_id)) {
        map.set(log.habit_id, new Map());
      }
      const day = dayjs(log.completed_date).date();
      map.get(log.habit_id)!.set(day, {
        is_completed: log.is_completed,
        id: log.id,
        notes: log.notes
      });
    });
    return map;
  }, [partnerLogs]);

  // Handle checking/unchecking
  const handleCellClick = (habit: Habit, day: number) => {
    // Can only log if user is "me" or if it is "couple" (toggles my log)
    if (userFilter === "partner" && !habit.is_shared) return;

    // Resolve habit ownership for editing: can only log if I own it, or if it is shared
    const isMyHabit = myHabits.some(h => h.id === habit.id);
    if (!isMyHabit && !habit.is_shared) return;

    const habitLogs = myLogsMap.get(habit.id);
    const logInfo = habitLogs?.get(day);
    const isCompleted = logInfo?.is_completed || false;

    // Validate that the target log date does not exceed today's date
    const completedDateObj = dayjs().year(selectedYear).month(selectedMonth).date(day).startOf("day");
    const todayObj = dayjs().startOf("day");
    if (completedDateObj.isAfter(todayObj)) {
      showToast(t("activity.future_date_error", { defaultValue: "Tidak bisa mencatat habit untuk tanggal di masa mendatang!" }), "error");
      return;
    }

    const completedDate = completedDateObj.format("YYYY-MM-DD");

    toggleMutation.mutate({
      habit_id: habit.id,
      completed_date: completedDate,
      is_completed: !isCompleted,
    });
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const isLoading = myHabitsLoading || partnerHabitsLoading || myLogsLoading || partnerLogsLoading;

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const years = Array.from({ length: 5 }, (_, i) => today.year() - 2 + i);

  return (
    <div className="card-duo p-5 md:p-6 flex flex-col gap-6 w-full">
      {/* Title & Navigation controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-highlight pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
            <Calendar className="h-5.5 w-5.5 text-primary" />
            <span>{t("activity.monthly_title")}</span>
          </h2>
          <p className="text-xs text-text-secondary font-semibold">
            {t("activity.monthly_desc")}
          </p>
        </div>

        {/* Month Navigation Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl border-2 border-border-color bg-card-surface hover:bg-highlight text-text-primary transition-all cursor-pointer shadow-[0_2px_0_var(--border-color)] active:translate-y-[2px] active:shadow-none"
          >
            <ChevronLeft className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
          <span className="font-extrabold text-sm text-text-primary px-3 py-1 bg-highlight rounded-xl border-2 border-border-color">
            {months[selectedMonth]} {selectedYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl border-2 border-border-color bg-card-surface hover:bg-highlight text-text-primary transition-all cursor-pointer shadow-[0_2px_0_var(--border-color)] active:translate-y-[2px] active:shadow-none"
          >
            <ChevronRight className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Select Dropdowns Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Month Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t("activity.select_month")}</label>
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
            {months.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </Select>
        </div>

        {/* Year Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t("activity.select_year")}</label>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>

        {/* Frequency Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t("habits.frequency")}</label>
          <Select value={frequencyFilter} onChange={(e) => setFrequencyFilter(e.target.value as any)}>
            <option value="all">{t("activity.filter_all")}</option>
            <option value="daily">{t("dashboard.daily")}</option>
            <option value="weekly">{t("dashboard.weekly")}</option>
            <option value="monthly">{t("dashboard.monthly")}</option>
          </Select>
        </div>
      </div>

      {/* User filter tabs */}
      <div className="tabs-duo-container">
        <button
          onClick={() => setUserFilter("me")}
          className={`tab-duo-btn ${userFilter === "me" ? "active" : ""}`}
        >
          {t("activity.user_me")}
        </button>
        {partner && (
          <>
            <button
              onClick={() => setUserFilter("partner")}
              className={`tab-duo-btn ${userFilter === "partner" ? "active" : ""}`}
            >
              {partner.name}
            </button>
            <button
              onClick={() => setUserFilter("couple")}
              className={`tab-duo-btn ${userFilter === "couple" ? "active" : ""}`}
            >
              {t("activity.user_couple")}
            </button>
          </>
        )}
      </div>

      {/* Habits Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Heart className="h-8 w-8 text-primary animate-bounce fill-current" />
          <span className="text-xs font-bold text-text-secondary">{t("common.loading")}</span>
        </div>
      ) : habitsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-highlight border-2 border-dashed border-border-color rounded-2xl text-center">
          <span className="text-3xl mb-2 animate-bounce">✨</span>
          <p className="font-extrabold text-sm text-text-primary">{t("activity.no_habits")}</p>
        </div>
      ) : (
        <div className="w-full border-2 border-border-color rounded-2xl overflow-hidden shadow-[0_2px_0_var(--border-color)]">
          {/* Scrollable table container */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-highlight border-b-2 border-border-color">
                  {/* Sticky Habit Column Header */}
                  <th className="sticky left-0 bg-highlight z-20 border-r-2 border-border-color text-left px-4 py-3 min-w-[150px] md:min-w-[180px] max-w-[200px] text-xs font-black text-text-primary uppercase tracking-wider shadow-[2px_0_0_0_var(--border-color)]">
                    {t("nav.habits")}
                  </th>
                  {/* Days columns */}
                  {daysArray.map((day) => {
                    const dateObj = dayjs().year(selectedYear).month(selectedMonth).date(day);
                    const isToday = dateObj.isSame(today, "day");
                    const isWeekend = dateObj.day() === 0 || dateObj.day() === 6;

                    return (
                      <th
                        key={day}
                        className={`text-center py-2 px-1 text-[11px] font-black min-w-[36px] w-[36px] border-r border-border-color/60 last:border-r-0 select-none ${isToday
                          ? "bg-primary/20 text-primary border-b-2 border-primary"
                          : isWeekend
                            ? "text-red-400 bg-highlight/30"
                            : "text-text-secondary"
                          }`}
                      >
                        <div>{day}</div>
                        <div className="text-[8px] font-bold opacity-60">
                          {dateObj.format("dd")}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {habitsList.map((habit) => {
                  const isShared = habit.is_shared;

                  return (
                    <tr
                      key={habit.id}
                      className="border-b border-border-color/60 last:border-b-0 hover:bg-highlight/20 transition-colors"
                    >
                      {/* Sticky Habit Label Cell */}
                      <td className="sticky left-0 bg-card-surface z-10 border-r-2 border-border-color px-4 py-2.5 shadow-[2px_0_0_0_var(--border-color)] align-middle">
                        <div className="flex items-center gap-2 max-w-[150px] md:max-w-[180px] overflow-hidden">
                          <span className="text-xl shrink-0 filter drop-shadow-sm select-none">{habit.icon_emoji}</span>
                          <div className="flex flex-col overflow-hidden leading-tight">
                            <span className="font-extrabold text-xs text-text-primary truncate" title={habit.title}>
                              {habit.title}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {!habit.is_active && (
                                <span className="text-[8px] font-bold text-text-secondary bg-border-color px-1.5 py-0.2 rounded-full uppercase shrink-0">
                                  Archived
                                </span>
                              )}
                              {isShared && (
                                <span className="text-[8px] font-bold text-primary bg-primary/10 border border-primary/20 px-1 py-0.2 rounded-full uppercase shrink-0">
                                  {t("dashboard.shared")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Days Grid Cells */}
                      {daysArray.map((day) => {
                        const myCompleted = myLogsMap.get(habit.id)?.get(day)?.is_completed || false;
                        const partnerCompleted = partnerLogsMap.get(habit.id)?.get(day)?.is_completed || false;

                        // Check permissions
                        const isMyHabit = myHabits.some(h => h.id === habit.id);
                        const canToggle = (userFilter === "me" && isMyHabit) || (userFilter === "couple" && isMyHabit) || (isShared && userFilter !== "partner");

                        // Render cell UI based on User Filter
                        return (
                          <td
                            key={day}
                            className="text-center p-0.5 border-r border-border-color/60 last:border-r-0 align-middle min-w-[36px]"
                          >
                            <div className="flex items-center justify-center w-full h-full min-h-[36px]">
                              {userFilter === "couple" && isShared ? (
                                /* Combined couple view for shared habits: split representation */
                                <button
                                  type="button"
                                  onClick={() => canToggle && handleCellClick(habit, day)}
                                  disabled={!canToggle}
                                  className={`relative w-8 h-8 rounded-lg border border-border-color bg-card-surface shadow-[0_2px_0_var(--border-color)] overflow-hidden transition-all flex justify-between p-0.5 ${canToggle ? "cursor-pointer active:translate-y-[1px] active:shadow-none" : "cursor-default"
                                    }`}
                                >
                                  {/* Left half: My progress */}
                                  <div
                                    className={`w-[45%] h-full rounded-md transition-all flex items-center justify-center text-[8px] font-black ${myCompleted
                                      ? "bg-primary text-text-primary border border-text-primary/20"
                                      : "bg-highlight text-text-secondary/20"
                                      }`}
                                    title={`${t("activity.user_me")}: ${myCompleted ? "Selesai" : "Belum"}`}
                                  >
                                    {myCompleted && "M"}
                                  </div>
                                  {/* Right half: Partner progress */}
                                  <div
                                    className={`w-[45%] h-full rounded-md transition-all flex items-center justify-center text-[8px] font-black ${partnerCompleted
                                      ? "bg-secondary text-text-primary border border-text-primary/20"
                                      : "bg-highlight text-text-secondary/20"
                                      }`}
                                    title={`${partner?.name || "Pasangan"}: ${partnerCompleted ? "Selesai" : "Belum"}`}
                                  >
                                    {partnerCompleted && "P"}
                                  </div>
                                </button>
                              ) : (
                                /* Standard single checkbox / dot cell */
                                <button
                                  type="button"
                                  onClick={() => canToggle && handleCellClick(habit, day)}
                                  disabled={!canToggle}
                                  className={`w-7.5 h-7.5 rounded-lg border-2 transition-all flex items-center justify-center select-none ${userFilter === "me"
                                    ? myCompleted
                                      ? "bg-primary border-primary text-text-primary shadow-[0_2px_0_color-mix(in srgb, var(--primary) 80%, #000)]"
                                      : "bg-card-surface border-border-color hover:bg-highlight text-transparent"
                                    : userFilter === "partner"
                                      ? partnerCompleted
                                        ? "bg-secondary border-secondary text-text-primary shadow-[0_2px_0_color-mix(in srgb, var(--secondary) 80%, #000)]"
                                        : "bg-card-surface border-border-color text-transparent"
                                      : /* Combined personal habit view */
                                      myCompleted || (partnerCompleted && isShared)
                                        ? "bg-accent border-accent text-text-primary shadow-[0_2px_0_color-mix(in srgb, var(--accent) 80%, #000)]"
                                        : "bg-card-surface border-border-color hover:bg-highlight text-transparent"
                                    } ${canToggle
                                      ? "cursor-pointer active:translate-y-[1.5px] active:shadow-none"
                                      : "cursor-default"
                                    }`}
                                  title={`${myCompleted ? "Saya Selesai" : "Saya Belum"} | ${partnerCompleted ? "Pasangan Selesai" : "Pasangan Belum"
                                    }`}
                                >
                                  {(userFilter === "me" && myCompleted) ||
                                    (userFilter === "partner" && partnerCompleted) ||
                                    (userFilter === "couple" && (myCompleted || partnerCompleted)) ? (
                                    <Check className="h-3 w-3 stroke-3" color="white" />
                                  ) : null}
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Legend */}
          <div className="bg-highlight/30 px-4 py-3 border-t-2 border-border-color text-xs font-bold text-text-secondary flex flex-wrap gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-primary border border-border-color inline-block"></span>
              <span>Selesai (Anda)</span>
            </span>
            {partner && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-secondary border border-border-color inline-block"></span>
                  <span>Selesai ({partner.name})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-l bg-primary w-2 h-3.5 inline-block border-y border-l border-border-color"></span>
                  <span className="w-3.5 h-3.5 rounded-r bg-secondary w-2 h-3.5 inline-block border-y border-r border-border-color -ml-2.5 mr-0.5"></span>
                  <span>Progress Pasangan (Gabungan)</span>
                </span>
              </>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-card-surface border-2 border-border-color inline-block"></span>
              <span>Belum Selesai / Kosong</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
