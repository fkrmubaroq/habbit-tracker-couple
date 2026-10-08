import * as React from "react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api-client";
import { useAuthStore } from "../../stores/auth.store";
import { useToastStore } from "../../stores/toast.store";
import { ConfirmResetModal } from "./confirm-reset-modal";

export function SectionDangerZone() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { showToast } = useToastStore();

  const [showConfirm, setShowConfirm] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  const handleResetData = async () => {
    setResetting(true);
    try {
      await api.delete("/users/reset-data");
      showToast(t("settings_page.reset_success"), "success");
      setShowConfirm(false);

      // Reload page to show fresh status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      showToast(err.response?.data?.error || t("settings_page.reset_failed"), "error");
    } finally {
      setResetting(false);
    }
  };

  if (user.role !== "husband") return null;

  return (
    <div className="card-duo border-red-200 dark:border-red-950/40 bg-red-50/5 p-5 md:p-6 flex flex-col gap-4 mt-2">
      <div className="border-b-2 border-highlight pb-3">
        <h2 className="text-lg font-black text-red-500 flex items-center gap-2">
          <span>⚠️</span>
          <span>{t("settings_page.danger_zone")}</span>
        </h2>
        <p className="text-xs text-text-secondary font-semibold">
          {t("settings_page.danger_zone_desc")}
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-xl">
          <h3 className="font-extrabold text-sm text-text-primary">
            {t("settings_page.reset_data_title")}
          </h3>
          <p className="text-xs font-semibold text-text-secondary leading-relaxed">
            {t("settings_page.reset_data_desc")}
          </p>
          {user?.role !== "husband" && (
            <p className="text-xs font-bold text-red-500/90 mt-1 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{t("settings_page.only_husband_allowed")}</span>
            </p>
          )}
        </div>

        <button
          onClick={() => user?.role === "husband" && setShowConfirm(true)}
          disabled={user?.role !== "husband"}
          className={`btn-3d text-white font-extrabold text-xs tracking-wider uppercase shrink-0 py-2.5 px-4 ${user?.role === "husband"
            ? "bg-red-500! border-red-600! hover:bg-red-600! shadow-[0_4px_0_0_#b91c1c]! active:translate-y-[2px] active:shadow-none cursor-pointer"
            : "bg-gray-300 border-gray-400 text-gray-500 shadow-none translate-y-0 opacity-50 cursor-not-allowed"
            }`}
        >
          {t("settings_page.reset_data_btn")}
        </button>
      </div>

      {/* Modal type-to-confirm */}
      <ConfirmResetModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleResetData}
        resetting={resetting}
      />
    </div>
  );
}
