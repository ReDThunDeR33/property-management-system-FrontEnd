import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchPeopleDetail, landlordSchema } from "@/lib/adminPeople";
import { AdminBadge } from "@/lib/adminUi";

/* ============================================================
   LANDLORD DETAIL — app/admin/landlords/[id]/page.tsx  (SSR)
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. DYNAMIC ROUTING — the [id] folder makes this ONE page
      serve /admin/landlords/1, /admin/landlords/2, … The
      route parameter arrives as `params` (awaited — Next.js
      15/16 style) and is used to build the backend URL.

   2. SSR — async Server Component: the server fetches
      GET /admin/landlord/find/:id with Axios + cookie JWT and
      validates it with Zod BEFORE rendering.

   3. not-found handling — an unknown id triggers Next.js's
      notFound(), which renders the nearest not-found.tsx.
   ============================================================ */

export default async function LandlordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let landlord;
  try {
    landlord = await fetchPeopleDetail(`landlord/find/${id}`, landlordSchema);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{landlord.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Landlord #{landlord.id}</p>
        </div>
        <Link
          href="/admin/landlords"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-900"
        >
          ← All landlords
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Profile</h2>
          <AdminBadge status={landlord.status ?? "active"} />
        </div>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email</dt>
            <dd className="mt-1 text-sm text-gray-800">{landlord.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Phone</dt>
            <dd className="mt-1 text-sm text-gray-800">{landlord.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Property</dt>
            <dd className="mt-1 text-sm text-gray-800">
              {landlord.property
                ? `Unit ${landlord.property.unit_number ?? landlord.property.id}`
                : "No property assigned"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Created By
            </dt>
            <dd className="mt-1 text-sm text-gray-800">{landlord.created_by?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Joined</dt>
            <dd className="mt-1 text-sm text-gray-800">
              {new Date(landlord.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
