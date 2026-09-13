import Link from "next/link";

/* ============================================================
   not-found.tsx — app/admin/complaints/[id]/not-found.tsx
   ------------------------------------------------------------
   Course requirement: "not-found" file inside a DYNAMIC route.
   Rendered when the complaint id does not match any record.
   ============================================================ */

export default function ComplaintNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
      <p className="text-5xl font-black text-dwellix-500">404</p>
      <h2 className="mt-3 text-2xl font-bold text-gray-900">Complaint not found</h2>
      <p className="mt-2 text-sm text-gray-500">
        This complaint does not exist or has been deleted.
      </p>
      <Link
        href="/admin/complaints"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-dwellix-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-dwellix-600"
      >
        Back to Complaints
      </Link>
    </div>
  );
}
