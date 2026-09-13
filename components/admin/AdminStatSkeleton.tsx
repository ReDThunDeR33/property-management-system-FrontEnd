/* ============================================================
   ADMIN STAT SKELETON (Server Component)
   ------------------------------------------------------------
   • Small reusable skeleton card shown by `loading.tsx` files
     while a page's data is being fetched (Course requirement:
     "loading" files).
   • PROPS: how many skeleton cards to render.
   ============================================================ */

export default function AdminStatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="card border border-base-300 bg-white shadow-sm"
        >
          <div className="card-body p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-base-300" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-base-300" />
          </div>
        </div>
      ))}
    </div>
  );
}
