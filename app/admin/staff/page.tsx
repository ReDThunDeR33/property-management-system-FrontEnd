import { fetchPeopleList, staffSchema } from "@/lib/adminPeople";
import AdminStaffManager from "@/components/admin/AdminStaffManager";

/* ============================================================
   STAFF PAGE — app/admin/staff/page.tsx  (SSR)
   ------------------------------------------------------------
   Same SSR + CSR pattern: server-side Axios fetch of
   GET /admin/staff/allstaff with the cookie JWT, Zod
   validation, then the rows go into the client manager via
   PROPS for Add/Edit/Delete.
   ============================================================ */

export default async function StaffPage() {
  const staff = await fetchPeopleList("staff/allstaff", staffSchema);

  return <AdminStaffManager staff={staff} />;
}
