type AdminCardProps = { title: string;value: string | number;hint?: string; tone?: "primary" | "success" | "warning" | "error" | "neutral";};

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
