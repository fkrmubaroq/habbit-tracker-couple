import { createFileRoute } from "@tanstack/react-router";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FileText, Heart } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { SectionAnalyticsChart } from "../components/analytics/section-analytics-chart";
import { SectionAnalyticsStreaks } from "../components/analytics/section-analytics-streaks";
import { SectionAnalyticsSummary } from "../components/analytics/section-analytics-summary";
import { Button } from "../components/ui/button";
import { useAnalytics } from "../hooks/use-analytics";
import { usePartnerProfile } from "../hooks/use-partner";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsComponent,
});

function AnalyticsComponent() {
  const { data: partner } = usePartnerProfile();
  const { t } = useTranslation();

  const [period, setPeriod] = React.useState<"daily" | "weekly" | "monthly">("daily");

  // Fetch analytics data
  const { data, isLoading } = useAnalytics(period);

  const exportPDF = async () => {
    const element = document.getElementById("analytics-report");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFDF8",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 295; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`HabitPasutri_Analytics_${period}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Heart className="h-8 w-8 text-primary animate-bounce fill-current" />
          <span className="font-bold text-text-secondary">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const chartData = data?.chartData || [];
  const streakHistory = data?.streakHistory || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">{t("analytics.analytics_title")}</h1>
          <p className="text-text-secondary font-semibold text-sm">{t("analytics.analytics_desc")}</p>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2.5 self-start sm:self-center">
          <Button onClick={exportPDF} variant="3d-white" className="flex items-center gap-1.5">
            <FileText className="h-4.5 w-4.5" />
            <span>{t("analytics.export_pdf")}</span>
          </Button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="tabs-duo-container">
        {(["daily", "weekly", "monthly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`tab-duo-btn ${period === p ? "active" : ""}`}
          >
            {t("dashboard." + p)}
          </button>
        ))}
      </div>

      {/* Printable Area Wrapper */}
      <div id="analytics-report" className="flex flex-col gap-6 w-full">
        {/* Summary Metric Cards */}
        <SectionAnalyticsSummary summary={summary} partnerName={partner?.name} />

        {/* Charts Section */}
        <SectionAnalyticsChart chartData={chartData} partnerName={partner?.name} />

        {/* Streaks Log Summary list */}
        <SectionAnalyticsStreaks streakHistory={streakHistory} />
      </div>
    </div>
  );
}

