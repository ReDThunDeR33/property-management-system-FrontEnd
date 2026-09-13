/* ============================================================
   loading.tsx — app/admin/complaints/[id]/loading.tsx
   ------------------------------------------------------------
   Course requirement: "loading" files on a DYNAMIC route.
   Next.js shows this while the complaint detail page is being
   prepared (Suspense boundary — zero configuration).
   ============================================================ */

export default function ComplaintLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-72 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
