/* ============================================================
   ADMIN STAT SKELETON — pure Tailwind loading placeholder
   ------------------------------------------------------------
   • Reusable via PROPS (count = how many skeleton cards).
   • animate-pulse is Tailwind's built-in shimmer utility —
     no component library needed after removing DaisyUI.
   ============================================================ */

export default function AdminStatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
          <div className="mt-3 h-2.5 w-28 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
