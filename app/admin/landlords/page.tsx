import { fetchPeopleList, landlordSchema } from "@/lib/adminPeople";
import AdminLandlordManager from "@/components/admin/AdminLandlordManager";

/* ============================================================
   LANDLORDS PAGE — app/admin/landlords/page.tsx  (SSR)
   ------------------------------------------------------------
   Course concepts demonstrated here:

   1. SSR — async Server Component: on every request the server
      reads the admin's cookie JWT, calls
      GET /admin/landlord/alllandlord with Axios, validates the
      response with the landlordSchema (Zod) and renders the
      complete HTML. (Course table: authenticated page → SSR.)

   2. SSR + CSR combination — the page does the server fetch,
      then hands the data to AdminLandlordManager (a client
      component) via PROPS for the interactive Add/Edit/Delete
      operations. (Course table: "Personalized dashboard →
      SSR + CSR".)

   3. Folder-based routing — /admin/landlords.
   ============================================================ */

export default async function LandlordsPage() {
  // Server-side fetch + Zod validation (fail-soft: [] on error)
  const landlords = await fetchPeopleList("landlord/alllandlord", landlordSchema);

  // Data flows DOWN into the client manager via props
  return <AdminLandlordManager landlords={landlords} />;
}
