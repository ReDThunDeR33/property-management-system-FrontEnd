import Link from "next/link";

/* ============================================================
   not-found.tsx — app/admin/complaints/[id]/not-found.tsx
   ------------------------------------------------------------
   Course requirement: "not-found" files. Shown when a dynamic
   complaint id does not exist (e.g. /admin/complaints/999).
   A page can also trigger it programmatically with notFound().
   ============================================================ */

export default function ComplaintNotFound() {
  return (
    <div className="card mx-auto max-w-md border border-base-300 bg-white shadow-sm">
      <div className="card-body items-center text-center">
        <h2 className="card-title text-xl">Complaint not found</h2>
        <p className="text-sm text-gray-500">
          This complaint does not exist or has been deleted.
        </p>
        <Link href="/admin/complaints" className="btn btn-primary btn-sm mt-3">
          Back to Complaint Center
        </Link>
      </div>
    </div>
  );
}
