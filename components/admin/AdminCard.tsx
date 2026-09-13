/* ============================================================
   ADMIN CARD (Server Component — reusable presentational unit)
   ------------------------------------------------------------
   Course concepts demonstrated here:
   • PROPS: everything (title, value, hint, tone) is passed in by
     the parent page — the card itself holds no data or logic.
     This is exactly the reusable-component + props pattern from
     Task2 (component/header.tsx receives name/message via props).
   • DaisyUI: uses the `card` component classes for the container.
   • `tone` maps to semantic DaisyUI colors, so pages stay
     visually consistent without repeating Tailwind strings.
   ============================================================ */

type AdminCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "error" | "neutral";
};

// Maps the tone prop → DaisyUI semantic text color.
const TONE_TEXT: Record<string, string> = {
  primary: "text-dwellix-500",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
  neutral: "text-base-content",
};

export default function AdminCard({
  title,
  value,
  hint,
  tone = "neutral",
}: AdminCardProps) {
  return (
    <div className="card bg-white shadow-sm border border-base-300">
      <div className="card-body p-5">
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-3xl font-bold ${TONE_TEXT[tone]}`}>{value}</p>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
    </div>
  );
}
