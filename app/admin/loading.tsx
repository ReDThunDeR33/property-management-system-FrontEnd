import AdminStatSkeleton from "@/components/admin/AdminStatSkeleton";

/* ============================================================
   loading.tsx — app/admin/loading.tsx
   ------------------------------------------------------------
   Course requirement: "loading" files.
   Next.js automatically shows this file's UI while any page
   inside /admin is being prepared (its data fetching is running).
   This is React Suspense boundary behavior provided by the
   App Router — zero configuration needed.
   ============================================================ */

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Skeleton header bar */}
      <div className="h-16 animate-pulse rounded-lg bg-base-300" />

      {/* Four skeleton stat cards (reusable component) */}
      <AdminStatSkeleton count={4} />
    </div>
  );
}
