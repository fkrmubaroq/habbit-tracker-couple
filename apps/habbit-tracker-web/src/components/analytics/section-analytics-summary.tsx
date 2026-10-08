import { useTranslation } from "react-i18next";

export interface SectionAnalyticsSummaryProps {
  summary?: {
    userCompletionRate: number;
    partnerCompletionRate: number;
    userTotalCompletions: number;
    partnerTotalCompletions: number;
  };
  partnerName?: string;
}

export function SectionAnalyticsSummary({ summary, partnerName }: SectionAnalyticsSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div className="card-duo flex flex-col gap-1 bg-highlight/30">
        <span className="text-[10px] font-extrabold text-text-secondary uppercase">{t("analytics.your_consistency")}</span>
        <span className="text-2xl font-black text-primary">{summary?.userCompletionRate}%</span>
      </div>

      <div className="card-duo flex flex-col gap-1 bg-highlight/30">
        <span className="text-[10px] font-extrabold text-text-secondary uppercase">
          {t("analytics.partner_consistency", { name: partnerName || t("dashboard.shared") })}
        </span>
        <span className="text-2xl font-black text-secondary">{summary?.partnerCompletionRate}%</span>
      </div>

      <div className="card-duo flex flex-col gap-1 bg-highlight/30">
        <span className="text-[10px] font-extrabold text-text-secondary uppercase">{t("analytics.your_completions")}</span>
        <span className="text-2xl font-black text-text-primary">{summary?.userTotalCompletions} {t("common.times")}</span>
      </div>

      <div className="card-duo flex flex-col gap-1 bg-highlight/30">
        <span className="text-[10px] font-extrabold text-text-secondary uppercase">{t("analytics.partner_completions")}</span>
        <span className="text-2xl font-black text-text-primary">{summary?.partnerTotalCompletions} {t("common.times")}</span>
      </div>
    </div>
  );
}
