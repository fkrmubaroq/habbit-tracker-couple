import { CheckCircle, XCircle } from "lucide-react";
import { useToastStore } from "../stores/toast.store";

export function Toaster() {
  const { toast, hideToast } = useToastStore();

  if (!toast) return null;

  const isSuccess = toast.type === "success";

  return (
    <>
      <style>{`
        @keyframes slideUpAndFadeIn {
          0% { transform: translate(-50%, 20px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-toast {
          animation: slideUpAndFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div
        onClick={hideToast}
        className={`fixed bottom-20 md:bottom-8 left-1/2 z-50 max-w-sm w-full px-4 sm:px-0 pointer-events-auto cursor-pointer animate-toast`}
      >
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-text-primary shadow-[0_4px_0_0_var(--text-primary)] transition-all ${isSuccess
            ? "bg-primary text-text-primary"
            : "bg-red-500 text-white"
            }`}
        >
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 shrink-0 stroke-[2.5]" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 stroke-[2.5]" />
          )}
          <span className="font-extrabold text-sm tracking-wide leading-relaxed">
            {toast.message}
          </span>
        </div>
      </div>
    </>
  );
}
