import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchPeopleDetail, staffSchema } from "@/lib/adminPeople";
import { AdminBadge } from "@/lib/adminUi";

/* ============================================================
   STAFF DETAIL — app/admin/staff/[id]/page.tsx  (SSR)
   ------------------------------------------------------------
   Dynamic route (await params) + SSR + Zod + notFound().
   ============================================================ */

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let member;
  try {
    member = await fetchPeopleDetail(`staff/find/${id}`, staffSchema);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{member.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Staff #{member.id}</p>
        </div>
        <Link
          href="/admin/staff"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-900"
        >
          ← All staff
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Profile</h2>
          <AdminBadge status={member.status ?? "active"} />
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email</dt>
            <dd className="mt-1 text-sm text-gray-800">{member.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Phone</dt>
            <dd className="mt-1 text-sm text-gray-800">{member.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Created By
            </dt>
            <dd className="mt-1 text-sm text-gray-800">{member.created_by?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Joined</dt>
            <dd className="mt-1 text-sm text-gray-800">
              {new Date(member.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
