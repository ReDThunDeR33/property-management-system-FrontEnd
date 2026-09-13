import AdminTenantManager from "@/components/admin/AdminTenantManager";
import { getAdminSession } from "@/lib/adminAuth";
import { getAdminList, tenantListSchema } from "@/lib/adminPeople";

/* ============================================================
   ADMIN TENANTS PAGE — app/admin/tenants/page.tsx
   ------------------------------------------------------------
   Same SSR + CSR hybrid as the landlords page: the Server
   Component fetches (Axios + Zod, cookie JWT) and passes the
   data via props to the client manager that handles
   Add / Edit / Delete in the browser. Tenant create also
   demonstrates the system's approval gate: admin creates as
   PENDING, a landlord approves.
   ============================================================ */

export default async function AdminTenantsPage() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <div className="card mx-auto max-w-md border border-base-300 bg-white shadow-sm">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Session required</h2>
          <p className="text-sm text-gray-500">
            Please log in as an admin again.
          </p>
        </div>
      </div>
    );
  }

  const tenants = await getAdminList(
    "/admin/tenant/alltenants",
    session.token,
    tenantListSchema,
  );

  return <AdminTenantManager initialTenants={tenants} />;
}
