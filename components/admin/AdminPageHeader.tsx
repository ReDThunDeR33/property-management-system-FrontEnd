type AdminPageHeaderProps = { title: string; subtitle: string; actionLabel?: string; actionHref?: string;};

export default function AdminPageHeader({ title, subtitle, actionLabel, actionHref,}: AdminPageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-base-content">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      {actionLabel && actionHref && (
        <a href={actionHref} className="btn btn-primary btn-sm">
          {actionLabel}
        </a>
      )}
    </section>
  );
}
