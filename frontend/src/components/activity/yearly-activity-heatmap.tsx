import dayjs from "dayjs";
import "dayjs/locale/id";
import dayOfYear from "dayjs/plugin/dayOfYear";
import { BarChart3, Heart, Info } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useMyLogs, usePartnerLogs } from "../../hooks/use-habit-logs";
import { useMyHabits, usePartnerHabits } from "../../hooks/use-habits";
import { usePartnerProfile } from "../../hooks/use-partner";
import type { Habit } from "../../types/index";
import { Select } from "../ui/select";

dayjs.extend(dayOfYear);

interface YearlyActivityHeatmapProps {
  currentUserId?: string;
}

const today = dayjs();
export function YearlyActivityHeatmap({ currentUserId }: YearlyActivityHeatmapProps) {
  const { t, i18n } = useTranslation();

  // State
  const [selectedYear, setSelectedYear] = React.useState<number>(today.year());
  const [userFilter, setUserFilter] = React.useState<"me" | "partner" | "couple">("me");
  const [habitFilter, setHabitFilter] = React.useState<string>("all");
  const [hoveredCell, setHoveredCell] = React.useState<{
    dateStr: string;
    completionsCount: number;
    x: number;
    y: number;
  } | null>(null);

  // Close tooltip when clicking anywhere outside
  React.useEffect(() => {
    const handleGlobalClick = () => {
      setHoveredCell(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const handleCellInteraction = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    dateStr: string,
    completionsCount: number
  ) => {
    // Prevent global click dismiss from firing on mobile tap
    if (event.type === "click") {
      event.stopPropagation();
    }

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const scrollContainer = target.closest(".heatmap-scroll-container");
    if (!scrollContainer) return;
    const parentRect = scrollContainer.getBoundingClientRect();

    // Calculate position absolute coordinates including container scrolling offset
    const x = rect.left - parentRect.left + scrollContainer.scrollLeft + rect.width / 2;
    const y = rect.top - parentRect.top + scrollContainer.scrollTop;

    setHoveredCell({
      dateStr,
      completionsCount,
      x,
      y,
    });
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  // Format date range for the selected year
  const startDateStr = React.useMemo(() => {
    return `${selectedYear}-01-01`;
  }, [selectedYear]);

  const endDateStr = React.useMemo(() => {
    return `${selectedYear}-12-31`;
  }, [selectedYear]);

  // Fetch habits and logs
  const { data: myHabits = [], isLoading: myHabitsLoading } = useMyHabits();
  const { data: partnerHabits = [], isLoading: partnerHabitsLoading } = usePartnerHabits();
  const { data: myLogs = [], isLoading: myLogsLoading } = useMyLogs(startDateStr, endDateStr);
  const { data: partnerLogs = [], isLoading: partnerLogsLoading } = usePartnerLogs(startDateStr, endDateStr);
  const { data: partner } = usePartnerProfile();

  // Available habits dropdown options based on User Filter
  const habitsDropdownList = React.useMemo(() => {
    let list: Habit[] = [];
    if (userFilter === "me") {
      list = myHabits;
    } else if (userFilter === "partner") {
      list = partnerHabits;
    } else {
      // Couple - merge unique IDs
      const myMap = new Map(myHabits.map(h => [h.id, h]));
      const partnerMap = new Map(partnerHabits.map(h => [h.id, h]));
      const allIds = new Set([...myMap.keys(), ...partnerMap.keys()]);
      list = Array.from(allIds).map(id => myMap.get(id) || partnerMap.get(id)!);
    }
    return list;
  }, [myHabits, partnerHabits, userFilter]);

  // Reset habit filter if the selected habit is no longer available in the user filter
  React.useEffect(() => {
    if (habitFilter !== "all" && !habitsDropdownList.some(h => h.id === habitFilter)) {
      setHabitFilter("all");
    }
  }, [userFilter, habitsDropdownList, habitFilter]);

  // Build grid data: Sunday-Saturday week columns
  const gridWeeks = React.useMemo(() => {
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);

    // Find the Sunday of the week containing January 1st
    const startDay = startDate.getDay();
    const gridStart = new Date(startDate);
    gridStart.setDate(startDate.getDate() - startDay);

    // Find the Saturday of the week containing December 31st
    const endDay = endDate.getDay();
    const gridEnd = new Date(endDate);
    gridEnd.setDate(endDate.getDate() + (6 - endDay));

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    const curr = new Date(gridStart);

    while (curr <= gridEnd) {
      currentWeek.push(new Date(curr));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      curr.setDate(curr.getDate() + 1);
    }
    return weeks;
  }, [selectedYear]);

  console.log({
    gridWeeks
  })

  // Aggregate logs to a Map of date -> completed count
  const dailyCompletionsMap = React.useMemo(() => {
    const map = new Map<string, number>();

    // Determine which logs to count
    let logsToCount = [];
    if (userFilter === "me") {
      logsToCount = myLogs;
    } else if (userFilter === "partner") {
      logsToCount = partnerLogs;
    } else {
      // Couple - combine logs
      logsToCount = [...myLogs, ...partnerLogs];
    }

    // Filter by specific habit if selected
    if (habitFilter !== "all") {
      logsToCount = logsToCount.filter(l => l.habit_id === habitFilter);
    }

    // Sum completions grouped by date
    logsToCount.forEach(log => {
      if (log.is_completed) {
        const formattedDate = dayjs(log.completed_date).format("YYYY-MM-DD");
        const count = map.get(formattedDate) || 0;
        map.set(formattedDate, count + 1);
      }
    });

    return map;
  }, [myLogs, partnerLogs, userFilter, habitFilter]);

  // Statistics calculation
  const stats = React.useMemo(() => {
    let totalCompletions = 0;
    let consistentDays = 0;

    dailyCompletionsMap.forEach((count) => {
      if (count > 0) {
        totalCompletions += count;
        consistentDays += 1;
      }
    });

    // Success rate = completed days / total days in the year up to now (or 365)
    const totalDaysInYear = selectedYear === today.year()
      ? Math.max(1, today.dayOfYear())
      : (selectedYear % 4 === 0 && (selectedYear % 100 !== 0 || selectedYear % 400 === 0) ? 366 : 365);

    const activeHabitsCount = habitsDropdownList.filter(h => h.is_active).length;
    // Estimated max possible check-ins in the year for active habits
    const totalPossibleCheckins = activeHabitsCount * totalDaysInYear;
    const successPercentage = totalPossibleCheckins > 0
      ? Math.min(100, Math.round((totalCompletions / totalPossibleCheckins) * 100))
      : 0;

    return {
      totalCompletions,
      consistentDays,
      successPercentage,
      activeHabitsCount
    };
  }, [dailyCompletionsMap, selectedYear, today, habitsDropdownList]);

  // Get color scale based on completions count
  const getCellColor = (count: number) => {

    if (count === 0) return "bg-highlight/50 dark:bg-highlight/20 border-border-color/40";

    // If specific habit is filtered, only two states: yes/no
    if (habitFilter !== "all") {
      return userFilter === "partner"
        ? "bg-secondary text-text-primary border-secondary/20 shadow-[0_1px_0_var(--secondary)]"
        : userFilter === "couple"
          ? "bg-accent text-text-primary border-accent/20 shadow-[0_1px_0_var(--accent)]"
          : "bg-primary text-text-primary border-primary/20 shadow-[0_1px_0_var(--primary)]";
    }

    // Multi-shade scale for all habits combined
    if (count === 1) return "bg-primary/25 border-primary/15";
    if (count === 2) return "bg-primary/50 border-primary/30";
    if (count === 3) return "bg-primary/75 border-primary/50";
    return "bg-primary border-primary shadow-[0_1px_0_color-mix(in srgb, var(--primary) 80%, #000)]";
  };

  const monthsShortID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  const monthsShortEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsShort = i18n.language.startsWith("id") ? monthsShortID : monthsShortEN;
  const daysShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const years = Array.from({ length: 5 }, (_, i) => today.year() - 2 + i);

  // Determine month labels position
  const monthLabels = React.useMemo(() => {
    const labels: { text: string; index: number }[] = [];
    let prevMonth = -1;
    gridWeeks.forEach((week, index) => {
      const firstDayOfWeek = week[0];
      const month = firstDayOfWeek.getMonth();
      if (month !== prevMonth) {
        // Only add label if it's the first time we see this month
        labels.push({ text: monthsShort[month], index });
        prevMonth = month;
      }
    });
    return labels;
  }, [gridWeeks]);

  const isLoading = myHabitsLoading || partnerHabitsLoading || myLogsLoading || partnerLogsLoading;

  return (
    <div className="card-duo p-5 md:p-6 flex flex-col gap-6 w-full">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-highlight pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
            <BarChart3 className="h-5.5 w-5.5 text-primary" />
            <span>{t("activity.yearly_title")}</span>
          </h2>
          <p className="text-xs text-text-secondary font-semibold">
            {t("activity.yearly_desc")}
          </p>
        </div>
      </div>

      {/* Select Dropdowns Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Year Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t("activity.select_year")}</label>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>

        {/* User Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t("activity.select_user")}</label>
          <Select value={userFilter} onChange={(e) => setUserFilter(e.target.value as any)}>
            <option value="me">{t("activity.user_me")}</option>
            {partner && (
              <>
                <option value="partner">{partner.name}</option>
                <option value="couple">{t("activity.user_couple")}</option>
              </>
            )}
          </Select>
        </div>

        {/* Habit Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t("activity.select_habit")}</label>
          <Select value={habitFilter} onChange={(e) => setHabitFilter(e.target.value)}>
            <option value="all">{t("activity.all_habits")}</option>
            {habitsDropdownList.map((h) => (
              <option key={h.id} value={h.id}>
                {h.icon_emoji} {h.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Stats Cards Dashboard Section */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total completions */}
          <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl bg-primary/20 text-primary p-2.5 rounded-xl border border-primary/25 shrink-0">🏆</span>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">{t("activity.completions_stat")}</span>
              <span className="text-lg font-black text-text-primary mt-1">{stats.totalCompletions}</span>
            </div>
          </div>

          {/* Consistent Days */}
          <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl bg-accent/20 text-accent p-2.5 rounded-xl border border-accent/25 shrink-0">🔥</span>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">{t("activity.days_stat")}</span>
              <span className="text-lg font-black text-text-primary mt-1">{t("activity.days_value", { count: stats.consistentDays })}</span>
            </div>
          </div>

          {/* Success rate percentage */}
          <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl bg-secondary/20 text-secondary p-2.5 rounded-xl border border-secondary/25 shrink-0">📈</span>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">{t("activity.percentage_stat")}</span>
              <span className="text-lg font-black text-text-primary mt-1">{stats.successPercentage}%</span>
            </div>
          </div>

          {/* Active habits count */}
          <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl bg-highlight border border-border-color/80 p-2.5 rounded-xl shrink-0">📋</span>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">{t("activity.active_habits")}</span>
              <span className="text-lg font-black text-text-primary mt-1">{stats.activeHabitsCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Heart className="h-8 w-8 text-primary animate-bounce fill-current" />
          <span className="text-xs font-bold text-text-secondary">{t("common.loading")}</span>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-2">
          {/* Heatmap Outer Wrapper for Horizontal Scroll */}
          <div className="relative heatmap-scroll-container overflow-x-auto border-2 border-border-color bg-card-surface p-4 rounded-2xl shadow-[0_2px_0_var(--border-color)]">
            <div className="min-w-[700px] flex flex-col gap-1 select-none">

              {/* Months header labels row */}
              <div className="relative h-5 text-[10px] font-extrabold text-text-secondary">
                {monthLabels.map((lbl, idx) => (
                  <div
                    key={`${lbl.text}-${idx}`}
                    className="absolute"
                    style={{ left: `${lbl.index * 24 + 36}px` }}
                  >
                    {lbl.text}
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="flex gap-1">
                {/* Left Days indicator column */}
                <div className="flex flex-col gap-1 justify-between text-[9px] font-extrabold text-text-secondary w-8 pr-1 mt-0.5">
                  <span>{i18n.language.startsWith("id") ? "Min" : "Sun"}</span>
                  <span>{i18n.language.startsWith("id") ? "Sel" : "Tue"}</span>
                  <span>{i18n.language.startsWith("id") ? "Kam" : "Thu"}</span>
                  <span>{i18n.language.startsWith("id") ? "Sab" : "Sat"}</span>
                </div>

                {/* Grid columns of weeks */}
                <div className="flex gap-1 flex-1">
                  {gridWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {week.map((day, dIdx) => {
                        const dayD = dayjs(day);
                        const isCurrentYear = dayD.year() === selectedYear;
                        const dateStr = dayD.format("YYYY-MM-DD");
                        const completionsCount = dailyCompletionsMap.get(dateStr) || 0;
                        const cellColorClass = isCurrentYear
                          ? getCellColor(completionsCount)
                          : "bg-transparent border-transparent pointer-events-none";

                        return (
                          <div
                            key={dIdx}
                            className={`size-5 rounded-[3px] border transition-all ${cellColorClass} ${isCurrentYear ? "cursor-pointer hover:scale-110 hover:border-text-primary/40" : ""
                              }`}
                            onMouseEnter={(e) => isCurrentYear && handleCellInteraction(e, dateStr, completionsCount)}
                            onMouseLeave={handleMouseLeave}
                            onClick={(e) => isCurrentYear && handleCellInteraction(e, dateStr, completionsCount)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Interactive Tooltip */}
            {hoveredCell && (
              <div
                className="absolute z-35 pointer-events-none bg-text-primary text-card-surface text-[10px] font-bold px-3 py-2 rounded-xl shadow-lg border border-border-color/20 -translate-x-1/2 -translate-y-full mb-2 flex flex-col gap-0.5"
                style={{
                  left: `${hoveredCell.x}px`,
                  top: `${hoveredCell.y - 6}px`,
                  transition: "left 0.1s ease, top 0.1s ease",
                }}
              >
                <div className="text-[8px] text-text-secondary font-black leading-none uppercase">
                  {dayjs(hoveredCell.dateStr)
                    .locale(i18n.language.startsWith("id") ? "id" : "en")
                    .format("D MMMM YYYY")}
                </div>
                <div className="text-[11px] font-black text-white mt-0.5 whitespace-nowrap">
                  {t("activity.completions_count", { count: hoveredCell.completionsCount })}
                </div>
                {/* Visual arrow at the bottom */}
                <div
                  className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-t-[5px] border-t-text-primary border-x-[5px] border-x-transparent"
                />
              </div>
            )}
          </div>

          {/* Density legend */}
          <div className="lg:flex-row flex-col flex items-center justify-between text-xs font-bold text-text-secondary px-1 py-1">
            <div className="lg:order-1 order-2 lg:mt-0 mt-4 flex items-center gap-1.5 bg-highlight/40 px-3 py-1.5 rounded-xl border border-border-color/60">
              <Info className="h-3.5 w-3.5 text-text-secondary" />
              <span>{t("activity.heatmap_info")}</span>
            </div>

            <div className="flex items-center gap-1.5 self-center">
              <span>{t("activity.less")}</span>
              <div className="size-4.5 rounded-[3px] border bg-highlight/50 border-border-color/40"></div>
              <div className="size-4.5 rounded-[3px] border bg-primary/25 border-primary/15"></div>
              <div className="size-4.5 rounded-[3px] border bg-primary/50 border-primary/30"></div>
              <div className="size-4.5 rounded-[3px] border bg-primary/75 border-primary/50"></div>
              <div className="size-4.5 rounded-[3px] border bg-primary border-primary"></div>
              <span>{t("activity.more")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
