import Link from "next/link";

/* ============================================================
   not-found.tsx — app/admin/not-found.tsx  (pure Tailwind)
   ------------------------------------------------------------
   Course requirement: "not-found" files.
   Shown automatically when a URL inside /admin doesn't match
   any route (or when a page calls the notFound() function).
   ============================================================ */

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <p className="text-5xl font-black text-dwellix-500">404</p>
      <h2 className="mt-3 text-2xl font-bold text-gray-900">Page not found</h2>
      <p className="mt-2 text-sm text-gray-500">
        The admin page you are looking for does not exist.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-dwellix-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-dwellix-600"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
