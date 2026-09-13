import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { fetchPeopleDetail, tenantSchema } from "@/lib/adminPeople";
import { AdminBadge } from "@/lib/adminUi";

/* ============================================================
   TENANT DETAIL — app/admin/tenants/[id]/page.tsx  (SSR)
   ------------------------------------------------------------
   Dynamic route (await params) + SSR + Zod. NOTE: the detail
   schema below EXTENDS the list schema with the NID document
   URL (returned only by find/:id) — password_hash is still
   deliberately EXCLUDED so the credential never reaches the UI.
   ============================================================ */

const tenantDetailSchema = tenantSchema.extend({
  nid_document_url: z.string().nullish(),
});

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let tenant;
  try {
    tenant = await fetchPeopleDetail(`tenant/find/${id}`, tenantDetailSchema);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{tenant.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Tenant #{tenant.id}</p>
        </div>
        <Link
          href="/admin/tenants"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-900"
        >
          ← All tenants
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Profile</h2>
            <AdminBadge status={tenant.status ?? "PENDING"} />
          </div>
          <dl className="mt-4 grid gap-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email</dt>
              <dd className="mt-1 text-sm text-gray-800">{tenant.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Phone</dt>
              <dd className="mt-1 text-sm text-gray-800">{tenant.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Has Vehicle
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{tenant.has_vehicle ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Registered
              </dt>
              <dd className="mt-1 text-sm text-gray-800">
                {new Date(tenant.created_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Tenancy card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Tenancy</h2>
          <dl className="mt-4 grid gap-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                NID Number
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{tenant.nid_number}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                NID Document
              </dt>
              <dd className="mt-1 text-sm">
                {tenant.nid_document_url ? (
                  <a
                    href={tenant.nid_document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-dwellix-600 hover:underline"
                  >
                    View document →
                  </a>
                ) : (
                  <span className="text-gray-800">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Assigned Property
              </dt>
              <dd className="mt-1 text-sm text-gray-800">
                {tenant.property
                  ? `Unit ${tenant.property.unit_number ?? tenant.property.id}`
                  : "Not assigned yet"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Approved By
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{tenant.approved_by?.name ?? "Pending"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
