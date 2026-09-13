import type { ReactNode } from "react";

export function AdminCard({
  title,
  value,
  hint,
  accent = false,
}: {
  title: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        accent ? "border-dwellix-500/40 bg-[#fff0ed]" : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  INPROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  CLOSED: "bg-gray-200 text-gray-700",
  APPROVED: "bg-emerald-100 text-emerald-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",

  neutral: "bg-gray-100 text-gray-700",
};

export function AdminBadge({ status }: { status: string }) {
  const style = BADGE_STYLES[status?.toUpperCase?.() ?? ""] ?? BADGE_STYLES.neutral;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style}`}
    >
      {status?.replace(/_/g, " ") ?? "—"}
    </span>
  );
}

/* ---------- Buttons ---------- */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-dwellix-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-dwellix-600 disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900";

/* ---------- Form fields ---------- */
export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-dwellix-500 focus:ring-2 focus:ring-dwellix-500/20 disabled:cursor-not-allowed disabled:bg-gray-100";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

/* ---------- Alerts ---------- */
export function AdminAlert({
  kind,
  children,
}: {
  kind: "success" | "error" | "info" | "warning";
  children: ReactNode;
}) {
  const styles = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-800",
    error: "border-red-300 bg-red-50 text-red-700",
    info: "border-blue-300 bg-blue-50 text-blue-800",
    warning: "border-amber-300 bg-amber-50 text-amber-800",
  }[kind];
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${styles}`}>{children}</div>
  );
}

/* ---------- Modal (pure Tailwind dialog) ---------- */
export function AdminModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop — click to close */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Panel */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Page header ---------- */
export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Table shells ---------- */
export const thClass =
  "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500";
export const tdClass = "px-4 py-3 text-sm text-gray-700";
