import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface SectionAnalyticsChartProps {
  chartData: any[];
  partnerName?: string;
}

export function SectionAnalyticsChart({ chartData, partnerName }: SectionAnalyticsChartProps) {
  const { t } = useTranslation();

  console.log("chartData", chartData)
  return (
    <div className="card-duo flex flex-col gap-4">
      <h2 className="font-extrabold text-sm text-text-primary flex items-center gap-2">
        <TrendingUp className="h-4.5 w-4.5 text-primary" />
        <span>{t("analytics.rate_over_time")}</span>
      </h2>
      <div className="h-72 w-full text-xs font-semibold">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="partnerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="period" stroke="var(--text-secondary)" />
            <YAxis domain={[0, 100]} stroke="var(--text-secondary)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card-surface)",
                borderColor: "var(--text-primary)",
                borderRadius: "12px",
                borderWidth: "2px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="userRate"
              name={t("dashboard.you")}
              stroke="var(--primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#userGrad)"
            />
            <Area
              type="monotone"
              dataKey="partnerRate"
              name={partnerName || t("dashboard.shared")}
              stroke="var(--secondary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#partnerGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
