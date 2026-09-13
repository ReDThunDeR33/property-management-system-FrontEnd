import AdminLandlordManager from "@/components/admin/AdminLandlordManager";
import { getAdminSession } from "@/lib/adminAuth";
import { getAdminList, peopleListSchema } from "@/lib/adminPeople";

/* ============================================================
   ADMIN LANDLORDS PAGE — app/admin/landlords/page.tsx
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. SSR + CSR HYBRID — course table:
      "Personalized dashboard -> SSR or SSR + CSR".
      The PAGE is a Server Component (SSR): it reads the admin's
      JWT cookie and fetches the live landlord list with Axios +
      Zod BEFORE sending HTML. The interactive part (Add / Edit /
      Delete) lives in the client component below, which
      receives the data via PROPS and runs in the browser (CSR).

   2. AXIOS + ZOD — server-side data layer (lib/adminPeople.ts)
      with the NEXT_PUBLIC_API_URL convention from .env.local.

   3. FOLDER-BASED ROUTING — app/admin/landlords/page.tsx =
      route /admin/landlords.
   ============================================================ */

export default async function AdminLandlordsPage() {
  // 1. AUTH: read the admin session from cookies (SSR).
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

  // 2. SSR FETCH: live landlord list (Axios + Zod, server-side).
  const landlords = await getAdminList(
    "/admin/landlord/alllandlord",
    session.token,
    peopleListSchema,
  );

  // 3. Pass validated data DOWN to the client manager (props).
  return <AdminLandlordManager initialLandlords={landlords} />;
}
