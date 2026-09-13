import AdminStaffManager from "@/components/admin/AdminStaffManager";
import { getAdminSession } from "@/lib/adminAuth";
import { getAdminList, peopleListSchema } from "@/lib/adminPeople";

/* ============================================================
   ADMIN STAFF PAGE — app/admin/staff/page.tsx
   ------------------------------------------------------------
   Same SSR + CSR hybrid as the landlords page: the Server
   Component fetches (Axios + Zod, cookie JWT) and passes the
   data via props to the client manager that handles
   Add / Edit / Delete in the browser.
   ============================================================ */

export default async function AdminStaffPage() {
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

  const staff = await getAdminList(
    "/admin/staff/allstaff",
    session.token,
    peopleListSchema,
  );

  return <AdminStaffManager initialStaff={staff} />;
}
