import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resetting: boolean;
}

export function ConfirmResetModal({
  isOpen,
  onClose,
  onConfirm,
  resetting,
}: ConfirmResetModalProps) {
  const { t } = useTranslation();
  const [confirmInput, setConfirmInput] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setConfirmInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="card-duo bg-card-surface border-border-color shadow-[0_6px_0_0_#1f2937] max-w-md w-full p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-black text-red-500">
            {t("settings_page.confirm_title")}
          </h3>
          <p className="text-xs font-semibold text-text-secondary mt-1">
            {t("settings_page.reset_data_desc")}
          </p>
        </div>

        <div className="flex flex-col gap-2 bg-highlight/50 p-3.5 rounded-xl border border-border-color">
          <label className="text-xs font-extrabold text-text-primary">
            {t("settings_page.confirm_desc")}
          </label>
          <Input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={t("settings_page.confirm_placeholder")}
            className="uppercase focus-visible:border-red-500!"
          />
        </div>

        <div className="flex justify-end gap-2.5 mt-2 border-t-2 border-highlight pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={resetting}
          >
            {t("settings_page.cancel_btn")}
          </Button>
          <Button
            type="button"
            variant="3d"
            onClick={onConfirm}
            disabled={confirmInput.toUpperCase() !== "RESET" || resetting}
            className={`text-white bg-red-500! border-red-600! hover:bg-red-600! shadow-[0_4px_0_0_#b91c1c]! active:translate-y-[1px] active:shadow-none ${
              confirmInput.toUpperCase() !== "RESET" ? "opacity-50 cursor-not-allowed shadow-none translate-y-0" : "cursor-pointer"
            }`}
          >
            {resetting ? "Resetting..." : t("settings_page.confirm_btn")}
          </Button>
        </div>
      </div>
    </div>
  );
}
