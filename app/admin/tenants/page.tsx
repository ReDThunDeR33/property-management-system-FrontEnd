import { fetchPeopleList, tenantSchema } from "@/lib/adminPeople";
import AdminTenantManager from "@/components/admin/AdminTenantManager";

/* ============================================================
   TENANTS PAGE — app/admin/tenants/page.tsx  (SSR)
   ------------------------------------------------------------
   Same SSR + CSR pattern as the landlords page: the server
   fetches GET /admin/tenant/alltenants (Axios + cookie JWT +
   Zod validation) on every request, then passes the validated
   rows into the client manager via PROPS for the interactive
   Add/Edit/Delete operations.
   ============================================================ */

export default async function TenantsPage() {
  // Server-side fetch + Zod validation (password_hash is
  // stripped by the schema and never reaches the UI)
  const tenants = await fetchPeopleList("tenant/alltenants", tenantSchema);

  return <AdminTenantManager tenants={tenants} />;
}
